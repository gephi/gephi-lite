import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../components/modals/ConfirmModal";
import { useFile, useFileActions } from "../context/dataContexts";
import { FileType } from "../file/types";
import { useModal } from "../modals";
import { useNotifications } from "../notifications";
import { useConnectedUser } from "../user";
import { fingerprintContent } from "./remoteContent";
import { CloudFile } from "./types";

// The passive freshness check (popup open / first modification / periodic tick) probes GitHub at
// most once per this window; after it, the next trigger probes again. It is also the period of the
// background re-check, so a long editing session keeps catching remote updates.
const RECHECK_INTERVAL = 60 * 1000; // ~1 minute

// Timestamp (ms) of the last probe for the current file, or null when it must be (re)checked. Reset
// whenever the current file changes (open/save/reload). Shared across every hook instance.
let lastCheckedAt: number | null = null;

// The remote version (its `updated_at`) the user was warned about and explicitly chose to keep
// their own changes over. Without this the passive check would raise the very same warning again
// at the next tick, and every minute after that, since nothing about the remote has changed.
// Only silences the passive warning: the pre-save probe still confirms before overwriting.
let acknowledgedRemoteUpdatedAt: string | null = null;

// Ignore a remote that is newer by at most this margin. GitHub's gist `updated_at` has second-level
// precision, and even after normalizing every read on the same "detail" endpoint a transient
// inconsistency could report a one-second-off timestamp for the same version; this absorbs it so no
// spurious "remote changed" warning appears. Trade-off: a genuine concurrent change that is only
// within this margin of our reference is not detected — kept small on purpose, and acceptable since
// the reference is refreshed on every open/save/reload/periodic check anyway.
const FRESHNESS_TOLERANCE = 1000; // ms

function isRemoteNewer(remoteUpdatedAt: Date | string, knownUpdatedAt: Date | string): boolean {
  // Dates may be plain strings after a localStorage rehydration, hence the new Date() on both sides.
  return new Date(remoteUpdatedAt).getTime() - new Date(knownUpdatedAt).getTime() > FRESHNESS_TOLERANCE;
}

/**
 * Hook exposing the remote-freshness guards for the currently open GitHub file:
 * - `check()`: passive, fire-and-forget probe (popup open / first modification / periodic tick).
 *   Deduped to at most one network round-trip per RECHECK_INTERVAL, never blocks nor delays editing,
 *   silently ignores errors (offline...), and on a newer remote shows a reload/keep warning.
 * - `probeRemoteIsNewer()`: awaited pre-save probe returning the current file when the remote is
 *   strictly newer (so the save flow can offer reload/overwrite/keep), else null. It shows no modal
 *   itself and never throws (returns null on error/offline, so the save can proceed).
 * - `reloadFile(file)`: reload the given file (discarding local changes for the up-to-date remote).
 */
export function useRemoteFileFreshnessCheck() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { current, remoteContentFingerprint } = useFile();
  const { open, setCurrentFile, setRemoteContentFingerprint } = useFileActions();
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  // Read the always-current file/user through refs, so the returned callbacks stay stable.
  const currentRef = useRef(current);
  currentRef.current = current;
  const userRef = useRef(user);
  userRef.current = user;
  const fingerprintRef = useRef(remoteContentFingerprint);
  fingerprintRef.current = remoteContentFingerprint;

  const reload = useCallback(
    async (file: FileType) => {
      try {
        // `open` re-reads the fresh remote metadata (detail endpoint) and memorizes THAT as the new
        // reference date, so we can pass the file we hold as-is: no need to pre-fetch here, and the
        // memorized date won't stay behind the remote (which would otherwise re-trigger the warning
        // in a loop right after each reload).
        await open(file);
        notify({ type: "success", message: t("graph.remote_changed.reload_success", { filename: file.filename }) });
      } catch (e) {
        console.error(e);
        notify({ type: "error", message: t("graph.remote_changed.reload_error") });
      }
    },
    [open, notify, t],
  );

  const warnRemoteChanged = useCallback(
    (file: FileType, messageKey: string, remoteUpdatedAt: Date | string) => {
      openModal({
        component: ConfirmModal,
        arguments: {
          title: t("graph.remote_changed.title"),
          message: t(messageKey, { filename: file.filename }),
          confirmMsg: t("graph.remote_changed.reload"),
          cancelMsg: t("graph.remote_changed.keep"),
        },
        afterSubmit: () => reload(file),
        // "Keep my changes": the user has seen this remote version and decided against it, so stop
        // raising it again every minute. A later, genuinely different remote version still warns.
        afterCancel: () => {
          acknowledgedRemoteUpdatedAt = new Date(remoteUpdatedAt).toISOString();
        },
      });
    },
    [openModal, reload, t],
  );

  /**
   * Second opinion on an apparently newer remote: download its content and check that it really
   * differs from what we last synced. A gist's `updated_at` moves for reasons that leave the file
   * untouched (a star, a fork, a comment, or two reads of the same version simply disagreeing), and
   * those must not raise an alarm in the middle of an editing session.
   *
   * Returns true when the remote must be reported as changed - including when the check itself
   * cannot be made (nothing to compare against, or the download failed): the guard exists to
   * prevent silently overwriting someone else's work, so doubt has to fall on the warning side.
   */
  const isRemoteContentReallyDifferent = useCallback(
    async (file: FileType, remote: Pick<CloudFile, "updatedAt">): Promise<boolean> => {
      const provider = userRef.current?.provider;
      const knownFingerprint = fingerprintRef.current;
      if (!provider || file.type !== "cloud") return true;

      let remoteFingerprint: string;
      try {
        remoteFingerprint = fingerprintContent(await provider.getFileContent(file.id));
      } catch (e) {
        console.error(e);
        return true;
      }

      // Nothing to compare against (state saved by a version that did not record it yet, or a
      // workspace restored from before this guard existed): the question cannot be answered, so
      // warn - but memorize what the remote holds, so the next check can decide properly instead
      // of asking again forever.
      if (!knownFingerprint) {
        setRemoteContentFingerprint(remoteFingerprint);
        return true;
      }

      if (remoteFingerprint !== knownFingerprint) return true;

      // Same bytes: adopt the new timestamp as our reference, so this bump is not re-examined (and
      // the content re-downloaded) on every subsequent tick.
      setCurrentFile({ ...file, updatedAt: remote.updatedAt });
      return false;
    },
    [setCurrentFile, setRemoteContentFingerprint],
  );

  const check = useCallback(() => {
    const now = Date.now();
    if (lastCheckedAt !== null && now - lastCheckedAt < RECHECK_INTERVAL) return;

    const file = currentRef.current;
    const provider = userRef.current?.provider;
    // Scope: only GitHub ("cloud") files, the ones another user/session can concurrently change.
    if (!provider || !file || file.type !== "cloud") return;

    // Mark as checked right away, so concurrent triggers (popup open, then first edit) don't each
    // fire a request within the window.
    lastCheckedAt = now;
    provider
      .getFile(file.id)
      .then(async (remote) => {
        if (!remote || !isRemoteNewer(remote.updatedAt, file.updatedAt)) return;
        // Already shown for this exact remote version, and dismissed with "keep my changes":
        if (new Date(remote.updatedAt).toISOString() === acknowledgedRemoteUpdatedAt) return;
        if (await isRemoteContentReallyDifferent(file, remote))
          warnRemoteChanged(file, "graph.remote_changed.message", remote.updatedAt);
      })
      .catch((e) => {
        // GitHub unreachable (offline...) or any error: never hinder editing, and re-arm so a later
        // trigger can retry.
        lastCheckedAt = null;
        console.error(e);
      });
  }, [warnRemoteChanged, isRemoteContentReallyDifferent]);

  const probeRemoteIsNewer = useCallback(async (): Promise<FileType | null> => {
    const file = currentRef.current;
    const provider = userRef.current?.provider;
    if (!provider || !file || file.type !== "cloud") return null;
    try {
      const remote = await provider.getFile(file.id);
      lastCheckedAt = Date.now();
      if (!remote || !isRemoteNewer(remote.updatedAt, file.updatedAt)) return null;
      return (await isRemoteContentReallyDifferent(file, remote)) ? file : null;
    } catch (e) {
      // Freshness can't be confirmed (offline...): treat as "not newer" so the save proceeds (it
      // fails on its own if the network is really down). Never block saving on a failed pre-check.
      console.error(e);
      return null;
    }
  }, [isRemoteContentReallyDifferent]);

  return { check, probeRemoteIsNewer, reloadFile: reload };
}

/**
 * Mounted once (in Initialize):
 * - re-arms the freshness check whenever a new file becomes the current one (open / save / reload
 *   all replace the `current` object reference),
 * - probes on the first modification that did not go through a create/edit popup (layout, metric,
 *   appearance, filter, direct table edit, delete...),
 * - re-checks periodically (every RECHECK_INTERVAL), so a long editing session still catches a
 *   remote update even without any further user action.
 *
 * The create/edit popups probe on their own opening, see useRemoteFileFreshnessCheck used in
 * EditNodeModal / EditEdgeModal; the save flow probes before overwriting, see the Header.
 */
export function useRemoteFileGuard() {
  const { check } = useRemoteFileFreshnessCheck();
  const { current, isDirty } = useFile();

  const prevCurrent = useRef(current);
  useEffect(() => {
    if (current !== prevCurrent.current) {
      prevCurrent.current = current;
      lastCheckedAt = null;
      acknowledgedRemoteUpdatedAt = null;
    }
  }, [current]);

  const wasDirty = useRef(isDirty);
  useEffect(() => {
    const previouslyDirty = wasDirty.current;
    wasDirty.current = isDirty;
    // Only react to the clean -> dirty transition (the moment the "unsaved changes" star appears):
    if (isDirty && !previouslyDirty) check();
  }, [isDirty, check]);

  useEffect(() => {
    const id = window.setInterval(() => check(), RECHECK_INTERVAL);
    return () => window.clearInterval(id);
  }, [check]);
}

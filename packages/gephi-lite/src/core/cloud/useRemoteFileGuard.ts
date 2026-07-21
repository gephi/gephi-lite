import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../components/modals/ConfirmModal";
import { useFile, useFileActions } from "../context/dataContexts";
import { FileType } from "../file/types";
import { useModal } from "../modals";
import { useNotifications } from "../notifications";
import { useConnectedUser } from "../user";

// The passive freshness check (popup open / first modification / periodic tick) probes GitHub at
// most once per this window; after it, the next trigger probes again. It is also the period of the
// background re-check, so a long editing session keeps catching remote updates.
const RECHECK_INTERVAL = 5 * 60 * 1000; // ~5 minutes

// Timestamp (ms) of the last probe for the current file, or null when it must be (re)checked. Reset
// whenever the current file changes (open/save/reload). Shared across every hook instance.
let lastCheckedAt: number | null = null;

function isRemoteNewer(remoteUpdatedAt: Date | string, knownUpdatedAt: Date | string): boolean {
  // Dates may be plain strings after a localStorage rehydration, hence the new Date() on both sides.
  return new Date(remoteUpdatedAt).getTime() > new Date(knownUpdatedAt).getTime();
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
  const { current } = useFile();
  const { open } = useFileActions();
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  // Read the always-current file/user through refs, so the returned callbacks stay stable.
  const currentRef = useRef(current);
  currentRef.current = current;
  const userRef = useRef(user);
  userRef.current = user;

  const reload = useCallback(
    async (file: FileType) => {
      try {
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
    (file: FileType, messageKey: string) => {
      openModal({
        component: ConfirmModal,
        arguments: {
          title: t("graph.remote_changed.title"),
          message: t(messageKey, { filename: file.filename }),
          confirmMsg: t("graph.remote_changed.reload"),
          cancelMsg: t("graph.remote_changed.keep"),
        },
        afterSubmit: () => reload(file),
      });
    },
    [openModal, reload, t],
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
      .then((remote) => {
        if (remote && isRemoteNewer(remote.updatedAt, file.updatedAt))
          warnRemoteChanged(file, "graph.remote_changed.message");
      })
      .catch((e) => {
        // GitHub unreachable (offline...) or any error: never hinder editing, and re-arm so a later
        // trigger can retry.
        lastCheckedAt = null;
        console.error(e);
      });
  }, [warnRemoteChanged]);

  const probeRemoteIsNewer = useCallback(async (): Promise<FileType | null> => {
    const file = currentRef.current;
    const provider = userRef.current?.provider;
    if (!provider || !file || file.type !== "cloud") return null;
    try {
      const remote = await provider.getFile(file.id);
      lastCheckedAt = Date.now();
      return remote && isRemoteNewer(remote.updatedAt, file.updatedAt) ? file : null;
    } catch (e) {
      // Freshness can't be confirmed (offline...): treat as "not newer" so the save proceeds (it
      // fails on its own if the network is really down). Never block saving on a failed pre-check.
      console.error(e);
      return null;
    }
  }, []);

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

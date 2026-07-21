import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../components/modals/ConfirmModal";
import { useFile, useFileActions } from "../context/dataContexts";
import { FileType } from "../file/types";
import { useModal } from "../modals";
import { useNotifications } from "../notifications";
import { useConnectedUser } from "../user";

// We probe GitHub at most once per "clean baseline" — i.e. once between two moments where the
// current file becomes clean again (open / save / reload). This covers both triggers (opening a
// create/edit popup, and the first actual modification) without doing a network round-trip on
// every popup open and then again on the following save. It is re-armed whenever the current file
// changes (see useRemoteFileGuard).
let hasCheckedSinceCleanBaseline = false;

/**
 * Hook exposing a `check()` that, the first time it is called for the current clean baseline,
 * probes the remote GitHub version of the currently open file and, if that version has been
 * updated (by another user or another session) since it was opened here, warns the user and
 * offers to reload the up-to-date version (discarding local changes) or to keep editing.
 *
 * The check is fire-and-forget: it never blocks nor delays editing. If GitHub is unreachable
 * (airplane mode, network error...), it silently does nothing and lets the user work normally.
 */
export function useRemoteFileFreshnessCheck() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { current } = useFile();
  const { open } = useFileActions();
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  // Read the always-current file/user through refs, so the returned callback stays stable.
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

  return useCallback(() => {
    if (hasCheckedSinceCleanBaseline) return;

    const file = currentRef.current;
    const provider = userRef.current?.provider;
    // Scope: only GitHub ("cloud") files, the ones another user/session can concurrently change.
    if (!provider || !file || file.type !== "cloud") return;

    // Mark as checked right away, so concurrent triggers (popup open, then first edit) don't each
    // fire a request. The memorized date may be a string after a localStorage rehydration, hence
    // the new Date() normalization on both sides.
    hasCheckedSinceCleanBaseline = true;
    const knownUpdatedAt = new Date(file.updatedAt).getTime();

    provider
      .getFile(file.id)
      .then((remote) => {
        if (!remote) return;
        if (new Date(remote.updatedAt).getTime() <= knownUpdatedAt) return;
        openModal({
          component: ConfirmModal,
          arguments: {
            title: t("graph.remote_changed.title"),
            message: t("graph.remote_changed.message", { filename: file.filename }),
            confirmMsg: t("graph.remote_changed.reload"),
            cancelMsg: t("graph.remote_changed.keep"),
          },
          afterSubmit: () => reload(file),
        });
      })
      .catch((e) => {
        // GitHub unreachable (offline...) or any error: never hinder editing, and allow a later
        // retry by re-arming the check.
        hasCheckedSinceCleanBaseline = false;
        console.error(e);
      });
  }, [openModal, reload, t]);
}

/**
 * Mounted once (in Initialize):
 * - re-arms the freshness check whenever a new file becomes the current one (open / save / reload
 *   all replace the `current` object reference),
 * - probes on the first modification that did not go through a create/edit popup (layout, metric,
 *   appearance, filter, direct table edit, delete...). Popups probe on their own opening, see
 *   useRemoteFileFreshnessCheck used in EditNodeModal / EditEdgeModal.
 */
export function useRemoteFileGuard() {
  const check = useRemoteFileFreshnessCheck();
  const { current, isDirty } = useFile();

  const prevCurrent = useRef(current);
  useEffect(() => {
    if (current !== prevCurrent.current) {
      prevCurrent.current = current;
      hasCheckedSinceCleanBaseline = false;
    }
  }, [current]);

  const wasDirty = useRef(isDirty);
  useEffect(() => {
    const previouslyDirty = wasDirty.current;
    wasDirty.current = isDirty;
    // Only react to the clean -> dirty transition (the moment the "unsaved changes" star appears):
    if (isDirty && !previouslyDirty) check();
  }, [isDirty, check]);
}

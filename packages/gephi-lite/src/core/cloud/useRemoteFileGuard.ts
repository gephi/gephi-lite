import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../components/modals/ConfirmModal";
import { useFile, useFileActions } from "../context/dataContexts";
import { FileType } from "../file/types";
import { useModal } from "../modals";
import { useNotifications } from "../notifications";
import { useConnectedUser } from "../user";

/**
 * Warns the user when the graph they start editing comes from a shared "network" location (a
 * GitHub file), and that remote version has been updated (by another user or another session)
 * since it was opened here.
 *
 * The check runs once, when the graph goes from "saved" to "modified" (the isDirty star lights
 * up): a network round-trip on every edit would be wasteful, and once the graph is dirty the star
 * stays lit, so there is nothing more to check until the next save clears it (which then re-arms
 * the check for the following edit).
 *
 * The offending edit is left applied locally: the warning simply offers to reload the up-to-date
 * remote version (discarding local changes) or to keep editing.
 */
export function useRemoteFileGuard() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { current, isDirty } = useFile();
  const { open } = useFileActions();
  const { openModal } = useModal();
  const [user] = useConnectedUser();

  // Read the always-current file/user through refs, so the transition effect below only re-runs
  // when isDirty actually changes, not on every unrelated re-render.
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

  const wasDirty = useRef(isDirty);
  useEffect(() => {
    const previouslyDirty = wasDirty.current;
    wasDirty.current = isDirty;

    // Only react to the clean -> dirty transition (the moment the "unsaved changes" star appears):
    if (!isDirty || previouslyDirty) return;

    const file = currentRef.current;
    const provider = userRef.current?.provider;
    // Scope: only GitHub ("cloud") files, the ones another user/session can concurrently change.
    if (!provider || !file || file.type !== "cloud") return;

    // The date memorized when the file was opened (or last saved). Normalized through Date, since
    // it may be a plain string after a page reload (fileState is rehydrated from localStorage).
    const knownUpdatedAt = new Date(file.updatedAt).getTime();

    provider
      .getFile(file.id)
      .then((remote) => {
        if (!remote) return;
        const remoteUpdatedAt = new Date(remote.updatedAt).getTime();
        if (remoteUpdatedAt <= knownUpdatedAt) return;

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
        // A failed check must never block editing: just log it and let the user keep working.
        console.error(e);
      });
  }, [isDirty, openModal, reload, t]);
}

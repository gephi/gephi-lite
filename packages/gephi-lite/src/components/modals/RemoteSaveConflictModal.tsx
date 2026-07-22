import { FC } from "react";
import { useTranslation } from "react-i18next";

import { ModalProps } from "../../core/modals/types";
import { Modal } from "../modals";

export type RemoteSaveConflictAction = "reload" | "overwrite";

/**
 * Shown when the user asks to save a GitHub file whose remote version has been updated (by another
 * user or session) since it was opened here. Unlike the passive edit-time warning (reload / keep),
 * this one also offers to overwrite, so the user is never stuck unable to save: keeping cancels the
 * save, reloading discards local changes for the remote version, overwriting saves anyway.
 */
const RemoteSaveConflictModal: FC<ModalProps<{ filename: string }, { action: RemoteSaveConflictAction }>> = ({
  cancel,
  submit,
  arguments: { filename },
}) => {
  const { t } = useTranslation();

  return (
    <Modal title={t("graph.remote_changed.title")} onClose={() => cancel()} doNotPreserveData>
      <>{t("graph.remote_changed.save_conflict_message", { filename })}</>
      {/* Full width + flex-wrap so all three buttons stay visible (and wrap) on narrow/mobile
          screens. "Keep my changes" is the default (highlighted and focused): it is the safest
          option, the two others (reload discards local changes, overwrite discards the remote) are
          de-emphasized. */}
      <div className="gl-gap-2 d-flex flex-wrap justify-content-end w-100">
        <button type="button" className="gl-btn gl-btn-outline" onClick={() => submit({ action: "overwrite" })}>
          {t("graph.remote_changed.overwrite")}
        </button>
        <button type="button" className="gl-btn gl-btn-outline" onClick={() => submit({ action: "reload" })}>
          {t("graph.remote_changed.reload")}
        </button>
        <button type="button" className="gl-btn gl-btn-fill" autoFocus onClick={() => cancel()}>
          {t("graph.remote_changed.keep")}
        </button>
      </div>
    </Modal>
  );
};

export default RemoteSaveConflictModal;

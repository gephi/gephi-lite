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
      <div className="gl-gap-2 d-flex flex-wrap">
        <button type="button" className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("graph.remote_changed.keep")}
        </button>
        <button type="button" className="gl-btn gl-btn-outline" onClick={() => submit({ action: "reload" })}>
          {t("graph.remote_changed.reload")}
        </button>
        <button type="button" className="gl-btn gl-btn-fill" onClick={() => submit({ action: "overwrite" })}>
          {t("graph.remote_changed.overwrite")}
        </button>
      </div>
    </Modal>
  );
};

export default RemoteSaveConflictModal;

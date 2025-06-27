import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { Modal } from "../modals";

const ConfirmModal: FC<
  ModalProps<{
    title: ReactNode;
    message: ReactNode;
    confirmMsg?: ReactNode;
    cancelMsg?: ReactNode;
    successMsg?: ReactNode;
  }>
> = ({ cancel, submit, arguments: { title, message, confirmMsg, cancelMsg, successMsg } }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();

  return (
    <Modal
      title={title}
      onClose={() => cancel()}
      doNotPreserveData
      onSubmit={() => {
        submit({});
        notify({ message: successMsg, type: "success" });
      }}
    >
      <>{message}</>
      <div className="gl-gap-2 d-flex">
        <button type="reset" className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {cancelMsg || t("common.cancel")}
        </button>
        <button type="submit" className="gl-btn gl-btn-fill">
          {confirmMsg || t("common.confirm")}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

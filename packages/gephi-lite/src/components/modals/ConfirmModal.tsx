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
      <>
        <button type="reset" className="btn btn-outline-dark" onClick={() => cancel()}>
          {cancelMsg || (t("common.cancel") as string)}
        </button>
        <button type="submit" className="btn btn-primary">
          {confirmMsg || (t("common.confirm") as string)}
        </button>
      </>
    </Modal>
  );
};

export default ConfirmModal;

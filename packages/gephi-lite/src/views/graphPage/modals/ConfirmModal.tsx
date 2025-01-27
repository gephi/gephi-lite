import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../../../components/modals";
import { ModalProps } from "../../../core/modals/types";
import { useNotifications } from "../../../core/notifications";

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
        <button type="reset" className="btn btn-outline-primary" onClick={() => cancel()}>
          {cancelMsg || (t("common.cancel") as string)}
        </button>
        <button type="submit" className="btn btn-danger">
          {confirmMsg || (t("common.confirm") as string)}
        </button>
      </>
    </Modal>
  );
};

export default ConfirmModal;

import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../../../components/modals";
import { ModalProps } from "../../../core/modals/types";

const ConfirmModal: FC<
  ModalProps<{ title: ReactNode; message: ReactNode; confirmMsg?: ReactNode; cancelMsg?: ReactNode }>
> = ({ cancel, submit, arguments: { title, message, confirmMsg, cancelMsg } }) => {
  const { t } = useTranslation();

  return (
    <Modal title={title} onClose={() => cancel()} onSubmit={() => submit({})}>
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

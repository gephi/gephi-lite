import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../../../../components/modals";
import { ModalProps } from "../../../../core/modals/types";

const UpdateEdgeModal: FC<ModalProps<{ edgeId: string }>> = ({ cancel, submit, arguments: { edgeId } }) => {
  const { t } = useTranslation();

  return (
    <Modal title={t("edition.update_edge") as string} onClose={() => cancel()}>
      <>TODO</>
    </Modal>
  );
};

export default UpdateEdgeModal;

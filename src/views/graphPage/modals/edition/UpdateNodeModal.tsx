import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../../../../components/modals";
import { ModalProps } from "../../../../core/modals/types";

const UpdateNodeModal: FC<ModalProps<{ nodeId: string }>> = ({ cancel, submit, arguments: { nodeId } }) => {
  const { t } = useTranslation();

  return (
    <Modal title={t("edition.update_node") as string} onClose={() => cancel()}>
      <>TODO</>
    </Modal>
  );
};

export default UpdateNodeModal;

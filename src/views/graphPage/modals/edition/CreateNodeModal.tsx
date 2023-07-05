import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../../../../components/modals";
import { ModalProps } from "../../../../core/modals/types";

const CreateNodeModal: FC<ModalProps<{}>> = ({ cancel, submit }) => {
  const { t } = useTranslation();

  return (
    <Modal title={t("edition.create_nodes") as string} onClose={() => cancel()}>
      <>TODO</>
    </Modal>
  );
};

export default CreateNodeModal;

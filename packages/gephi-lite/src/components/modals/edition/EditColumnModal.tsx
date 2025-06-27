import { FC } from "react";
import { useTranslation } from "react-i18next";

import { ModalProps } from "../../../core/modals/types";
import { FieldModelFormOnly, FieldModelFormProps, FieldModelFormSubmit } from "../../forms/FieldModelForm";
import { Modal } from "../../modals";

export const EditColumnModal: FC<ModalProps<FieldModelFormProps>> = ({ cancel, arguments: props }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        !props.fieldModel
          ? t("datatable.create_column")
          : t("datatable.modify_column", { name: props.fieldModel.label || props.fieldModel.id })
      }
      onClose={() => cancel()}
      className="modal-lg"
    >
      <FieldModelFormOnly {...props} onSuccess={cancel} />
      <FieldModelFormSubmit onCancel={cancel} creation={props.fieldModel === undefined} />
    </Modal>
  );
};

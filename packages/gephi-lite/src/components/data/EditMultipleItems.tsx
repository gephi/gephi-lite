import { FieldModel, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { FieldModelIcon } from "../common-icons";
import { Select } from "../forms/Select";
import { Modal } from "../modals";
import { EditItemAttribute } from "./Attribute";

export type EditMultipleItemsFormProps = {
  onSubmitted: () => void;
  onCancel: () => void;
  type: ItemType;
  items: Set<string>;
};

type FieldOption = {
  value: string;
  label: string | ReactNode;
  field: FieldModel;
};

export const useEditMultipleItemsForm = ({ onSubmitted, onCancel, type, items }: EditMultipleItemsFormProps) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { updateItems } = useGraphDatasetActions();

  const fieldOptions = useMemo<FieldOption[]>(
    () =>
      (type === "nodes" ? nodeFields : edgeFields).map((field) => ({
        field,
        value: field.id,
        label: (
          <>
            <FieldModelIcon type={field.type} /> {field.label || field.id}
          </>
        ),
      })),
    [edgeFields, nodeFields, type],
  );

  const [state, setState] = useState<{ field: FieldModel | undefined; value: Scalar }>({
    field: fieldOptions[0]?.field,
    value: "",
  });

  const submit = useCallback(() => {
    if (!state.field?.id) return;

    try {
      updateItems(type, items, state.field.id, state.value);
      notify({
        type: "success",
        title: t(`edition.update_multiple_${type}`),
        message: t(`edition.update_multiple_${type}_success`, { count: items.size }),
      });
      onSubmitted();
    } catch (e) {
      notify({
        type: "error",
        title: t(`edition.update_multiple_${type}`),
        message: (e as Error).message || t("error.unknown"),
      });
    }
  }, [items, notify, onSubmitted, state.field?.id, state.value, t, type, updateItems]);

  return {
    submit,
    main: (
      <>
        <h2>{t(`edition.update_multiple_${type}`)}</h2>

        <div className="panel-block">
          <div>
            <label htmlFor="multi-edit-attribute" className="form-label">
              {t("edition.multi.select_attribute")}
            </label>
            <Select<FieldOption>
              required
              isClearable={false}
              id="multi-edit-attribute"
              options={fieldOptions}
              value={fieldOptions.find((o) => o.value === state.field?.id)}
              onChange={(option) => {
                setState({
                  field: option!.field,
                  value: "",
                });
              }}
            />
          </div>
          {state.field && (
            <div>
              <label htmlFor="multi-edit-value" className="form-label">
                {t("edition.multi.select_value")}
              </label>
              <EditItemAttribute
                field={state.field}
                scalar={state.value}
                onChange={(value) => setState((state) => ({ ...state, value }))}
                id="multi-edit-value"
              />
            </div>
          )}
        </div>
      </>
    ),
    footer: (
      <>
        <button
          type="button"
          className="gl-btn"
          onClick={() => {
            if (onCancel) onCancel();
          }}
        >
          {t("common.cancel")}
        </button>

        <button type="submit" className="gl-btn gl-btn-fill">
          {t(`edition.update_multiple_${type}`)}
        </button>
      </>
    ),
  };
};

export const EditMultipleItemsModal: FC<ModalProps<Omit<EditMultipleItemsFormProps, "onSubmitted" | "onCancel">>> = ({
  cancel,
  submit,
  arguments: props,
}) => {
  const { t } = useTranslation();
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditMultipleItemsForm({
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
    ...props,
  } as EditMultipleItemsFormProps);

  return (
    <Modal
      title={t(`edition.update_multiple_${props.type}`)}
      onClose={() => cancel()}
      className="modal-lg edit-attribute"
      onSubmit={submitForm}
    >
      {main}
      {footer}
    </Modal>
  );
};

export const EditMultipleItemsForm: FC<EditMultipleItemsFormProps> = (props) => {
  const { main, footer, submit: submitForm } = useEditMultipleItemsForm(props);

  return (
    <form className="panel-wrapper" onSubmit={submitForm}>
      {main}
      {footer}
    </form>
  );
};

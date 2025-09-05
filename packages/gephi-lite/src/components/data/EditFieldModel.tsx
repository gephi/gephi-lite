import { FieldModel, FieldModelType, ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { DateTime } from "luxon";
import { FC, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { DATE_FORMATS } from "../../utils/date";
import { CancelIcon } from "../common-icons";
import { BaseOption, Select } from "../forms/Select";
import { Modal } from "../modals";

export type EditFieldModelFormProps = {
  onSubmitted: () => void;
  onCancel: () => void;
  type: ItemType;
} & (
  | { fieldModelId: string; insertAt?: undefined }
  | { fieldModelId?: undefined; insertAt?: { id: string; pos: "before" | "after" } }
);

export const useEditFieldModelForm = ({
  onSubmitted,
  onCancel,
  type,
  fieldModelId,
  insertAt,
}: EditFieldModelFormProps) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { createFieldModel, setFieldModel } = useGraphDatasetActions();

  const fields = type === "nodes" ? nodeFields : edgeFields;
  const htmlIDPrefix = fieldModelId || "newField";
  const isNew = !fieldModelId;

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldModel<ItemType, false>>({
    defaultValues: fieldModelId
      ? fields.find((f) => f.id === fieldModelId)
      : { type: "text", dynamic: false, itemType: type },
  });

  const fieldModel = watch();
  const submit = useMemo(
    () =>
      handleSubmit((newFieldModel: FieldModel) => {
        if (!fieldModelId) {
          const atIndex = insertAt
            ? fields.findIndex((f) => f.id === insertAt.id) + (insertAt.pos === "before" ? -1 : 1)
            : undefined;
          try {
            createFieldModel(newFieldModel, { index: atIndex });
            notify({
              type: "success",
              title: t(`edition.create_${type}_field`),
              message: t(`edition.create_${type}_field_success`),
            });
          } catch (e) {
            notify({
              type: "error",
              title: t(`edition.create_${type}_field`),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        } else {
          try {
            // when editing id input is disabled and thus id is not added in newFieldModel by react-form
            setFieldModel({ ...newFieldModel, id: fieldModelId });
            notify({
              type: "success",
              title: t(`edition.update_${type}_field`),
              message: t(`edition.update_${type}_field_success`),
            });
          } catch (e) {
            notify({
              type: "error",
              title: t(`edition.update_${type}_field`),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
        if (onSubmitted) onSubmitted();
      }),
    [handleSubmit, fieldModelId, onSubmitted, insertAt, fields, createFieldModel, notify, t, type, setFieldModel],
  );

  const idCollisionLabel = errors.id ? fields.find((f) => f.id === fieldModel.id)?.label : undefined;

  return {
    submit,
    main: (
      <div className="panel-block">
        <div>
          <label htmlFor={`${htmlIDPrefix}-column-id`} className="form-label">
            {t("graph.model.field.id")}
          </label>
          <input
            type="text"
            id={`${htmlIDPrefix}-column-id`}
            className={cx("form-control", errors.id && "is-invalid")}
            {...register("id", {
              disabled: !isNew,
              required: true,
              validate: isNew
                ? (val) => {
                    return fields.find((f) => f.id === val) === undefined;
                  }
                : undefined,
            })}
          />
          {errors.id && (
            <div className="invalid-feedback">
              {t(`error.form.${errors.id.type === "validate" ? "unique" : errors.id.type}`)}
              {idCollisionLabel && (
                <>
                  <br />
                  {t(`error.form.field_already_exists`, { id: fieldModel.id, label: idCollisionLabel })}
                </>
              )}
            </div>
          )}
        </div>
        <div>
          <label htmlFor={`${htmlIDPrefix}-column-label`} className="form-label">
            {t("graph.model.field.label")}
          </label>
          <input
            type="text"
            id={`${htmlIDPrefix}-column-label`}
            className={cx("form-control")}
            {...register("label")}
          />
        </div>
        <div>
          <label htmlFor={`${htmlIDPrefix}-column-type`} className="form-label">
            {t("graph.model.field.type")}
          </label>
          <Select<BaseOption<FieldModelType>, false>
            id={`${htmlIDPrefix}-column-type`}
            options={[
              { value: "number", label: "number" },
              { value: "category", label: "category" },
              { value: "keywords", label: "keywords" },
              { value: "date", label: "date" },
              { value: "text", label: "text" },
              { value: "color", label: "color" },
              { value: "boolean", label: "boolean" },
            ]}
            value={{ value: fieldModel.type, label: fieldModel.type }}
            onChange={(option) => {
              setValue("type", option ? option.value : "text");
              if (option?.value !== "keywords") setValue("separator", "");
              if (option?.value !== "date") setValue("format", "");
            }}
          />
        </div>

        {/* Date format */}
        {fieldModel.type === "date" && (
          <div>
            <label htmlFor={`${htmlIDPrefix}-column-date-format`} className="form-label">
              {t("graph.model.field.date-format")}
            </label>
            <input
              type="text"
              id={`${htmlIDPrefix}-column-date-format`}
              list={`${htmlIDPrefix}-column-date-formats`}
              className="form-control"
              {...register("format", { required: fieldModel.type === "date" })}
              disabled={fieldModel.type !== "date"}
            />
            <datalist id={`${htmlIDPrefix}-column-date-formats`}>
              {DATE_FORMATS.map(({ format, description }) => (
                <option key={format} value={format} label={`${description}: ${format}`}></option>
              ))}
            </datalist>
            {"format" in fieldModel && fieldModel.format && (
              <div className="text-muted gl-my-sm">
                {t("graph.model.field.will_be_serialized_as", { type: "Dates" })}:{" "}
                <code>{DateTime.now().toFormat(fieldModel.format)}</code>
              </div>
            )}

            <div className="text-muted mt-2">
              {t("graph.model.field.dates_formats_message")}{" "}
              <a target="_blank" rel="noreferrer" href="https://moment.github.io/luxon/#/parsing?id=table-of-tokens">
                {t("graph.model.field.dates_formats_link_message")}
              </a>
            </div>
          </div>
        )}

        {/* Keywords separator */}
        {fieldModel.type === "keywords" && (
          <div>
            <label htmlFor={`${htmlIDPrefix}-column-separator`} className="form-label">
              {t("graph.model.field.separator")}
            </label>
            <input
              type="text"
              id={`${htmlIDPrefix}-column-separator`}
              className={cx("form-control")}
              {...register("separator", { required: fieldModel.type === "keywords" })}
              disabled={fieldModel.type !== "keywords"}
            />
            {"separator" in fieldModel && fieldModel.separator && (
              <div className="text-muted gl-my-sm">
                {t("graph.model.field.will_be_serialized_as", { type: "Keywords" })}:{" "}
                <code>{["keyword 1", "keyword 2"].join(fieldModel.separator)}</code>
              </div>
            )}
          </div>
        )}
      </div>
    ),
    footer: (
      <div className="gl-actions">
        <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
          <CancelIcon />
        </button>

        <button type="submit" className="gl-btn gl-btn-fill">
          {isNew ? t("datatable.create_column") : t("datatable.modify_column")}
        </button>
      </div>
    ),
  };
};

export const EditFieldModelModal: FC<ModalProps<Omit<EditFieldModelFormProps, "onSubmitted" | "onCancel">>> = ({
  cancel,
  submit,
  arguments: props,
}) => {
  const { t } = useTranslation();
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditFieldModelForm({
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
    ...props,
  } as EditFieldModelFormProps);

  return (
    <Modal
      title={t(`edition.${!props.fieldModelId ? "create_" : "update_"}${props.type}_field`)}
      onClose={() => cancel()}
      className="modal-lg edit-attribute"
      onSubmit={submitForm}
    >
      <div className="d-flex flex-column gl-gap-3">{main}</div>

      {footer}
    </Modal>
  );
};

export const EditFieldModelForm: FC<EditFieldModelFormProps> = (props) => {
  const { t } = useTranslation();
  const { main, footer, submit: submitForm } = useEditFieldModelForm(props);

  return (
    <form className="panel-wrapper" onSubmit={submitForm}>
      <div className="panel-body">
        <h2>{t(`edition.${!props.fieldModelId ? "create_" : "update_"}${props.type}_field`)}</h2>
        {main}
      </div>

      <div className="panel-footer">{footer}</div>
    </form>
  );
};

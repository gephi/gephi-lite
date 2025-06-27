import { FieldModel, FieldModelType, ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { DateTime } from "luxon";
import { FC, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { BaseOption, Select } from "./Select";

export type FieldModelFormProps = { onCancel?: () => void; onSuccess?: () => void } & (
  | {
      fieldModel: FieldModel<ItemType, false>;
      insertAt?: undefined;
      itemType?: undefined;
    }
  | { fieldModel?: undefined; insertAt?: { pos: "before" | "after"; id: string }; itemType: ItemType }
);

export const FieldModelFormOnly: FC<FieldModelFormProps> = ({ onSuccess, onCancel, ...props }) => {
  const { t } = useTranslation();

  const { nodeFields, edgeFields } = useGraphDataset();
  const { createFieldModel, setFieldModel } = useGraphDatasetActions();

  const fields =
    (props.fieldModel && props.fieldModel.itemType === "nodes") || props.itemType === "nodes" ? nodeFields : edgeFields;

  const isNew = props.fieldModel === undefined;

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    // resetField,
    formState: { errors },
  } = useForm<FieldModel<ItemType, false>>({
    defaultValues: props.fieldModel || { type: "text", dynamic: false, itemType: props.itemType },
  });

  const fieldModel = watch();
  const onSubmit = useCallback(
    (newFieldModel: FieldModel) => {
      console.log("submit", newFieldModel);
      if (isNew) {
        const atIndex =
          props.insertAt !== undefined
            ? fields.findIndex((f) => f.id === props.insertAt?.id) + (props.insertAt.pos === "before" ? -1 : 1)
            : undefined;
        createFieldModel(newFieldModel, atIndex);
      } else {
        // when editing id input is disabled and thus id is not added in newFieldModel by react-form
        setFieldModel({ ...newFieldModel, id: props.fieldModel?.id });
      }
      if (onSuccess) onSuccess();
    },
    [props.insertAt, createFieldModel, setFieldModel, isNew, fields, onSuccess, props.fieldModel?.id],
  );

  const idCollisionLabel = errors.id ? fields.find((f) => f.id === fieldModel.id)?.label : undefined;
  console.log(errors, idCollisionLabel);
  return (
    <form key="field-model-form" id="field-model-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="modal-body">
        <div className="gl-my-md">
          <label htmlFor="column-id" className="form-label">
            {t("graph.model.field.id")}
          </label>
          <input
            type="text"
            id="column-id"
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
        <div className="gl-my-md">
          <label htmlFor="column-label" className="form-label">
            {t("graph.model.field.label")}
          </label>
          <input type="text" id="column-label" className={cx("form-control")} {...register("label")} />
        </div>
        <div className="gl-my-md">
          <label htmlFor="column-type" className="form-label">
            {t("graph.model.field.type")}
          </label>
          <Select<BaseOption<FieldModelType>, false>
            id="column-type"
            options={[
              { value: "number", label: "number" },
              { value: "category", label: "category" },
              { value: "keywords", label: "keywords" },
              { value: "date", label: "date" },
              { value: "text", label: "text" },
            ]}
            value={{ value: fieldModel.type, label: fieldModel.type }}
            onChange={(option) => {
              setValue("type", option ? option.value : "text");
              if (option?.value !== "keywords") setValue("separator", "");
              if (option?.value !== "date") setValue("format", "");
              // resetField("format",{keepError:false});
              // resetField("separator");
            }}
          />
        </div>
        {/* Date format */}

        <div className="gl-my-md">
          <label htmlFor="column-date-format" className="form-label">
            {t("graph.model.field.date-format")}
          </label>
          <input
            type="text"
            id="column-date-format"
            className="form-control"
            {...register("format", { required: fieldModel.type === "date" })}
            disabled={fieldModel.type !== "date"}
          />
          {/* TODO: add documentation to format : https://moment.github.io/luxon/#/parsing?id=table-of-tokens */}
          {"format" in fieldModel && fieldModel.format && (
            <div className="text-muted gl-my-sm">
              {t("graph.model.field.will_be_serialized_as", { type: "Dates" })}:{" "}
              <code>{DateTime.now().toFormat(fieldModel.format)}</code>
            </div>
          )}
        </div>

        {/* Keywords separator */}

        <div className="gl-my-md">
          <label htmlFor="column-separator" className="form-label">
            {t("graph.model.field.separator")}
          </label>
          <input
            type="text"
            id="column-separator"
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
      </div>
    </form>
  );
};

export const FieldModelFormSubmit: FC<{ onCancel?: () => void; creation?: boolean }> = ({ onCancel, creation }) => {
  const { t } = useTranslation();
  return (
    <div key="field_model-submit" className="d-flex gl-gap-md">
      <button
        type="button"
        className="gl-btn gl-btn-outline"
        onClick={() => {
          if (onCancel) onCancel();
        }}
      >
        {t("common.cancel")}
      </button>

      <button className="gl-btn gl-btn-fill" form="field-model-form">
        {creation ? t("datatable.create_column") : t("datatable.modify_column")}
      </button>
    </div>
  );
};

export const FieldModelForm: FC<FieldModelFormProps> = (props) => {
  return (
    <>
      <FieldModelFormOnly {...props} />
      <div className="gl-my-md">
        <FieldModelFormSubmit onCancel={props.onCancel} creation={props.fieldModel === undefined} />
      </div>
    </>
  );
};

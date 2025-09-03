import { FieldModelTypeSpec, toNumber } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, keyBy, pick } from "lodash";
import { FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions, useSelectionActions } from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { Scalar } from "../../core/types";
import { GraphSearch } from "../GraphSearch";
import { CancelIcon, FieldModelIcon } from "../common-icons";
import { Select } from "../forms/Select";
import { Modal } from "../modals";
import { EditItemAttribute } from "./Attribute";

interface UpdatedEdgeState {
  id: string;
  source: string;
  target: string;
  isDirected: boolean;
  attributes: ({ key: string; value: Scalar } & FieldModelTypeSpec)[];
}

const useEditEdgeForm = ({
  edgeId,
  onSubmitted,
  onCancel,
}: {
  edgeId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { emitter } = useEventsContext();
  const { select } = useSelectionActions();
  const { createEdge, updateEdge } = useGraphDatasetActions();
  const { edgeData, layout, fullGraph, edgeFields } = useGraphDataset();
  const edgeFieldsIndex = useMemo(() => keyBy(edgeFields, "id"), [edgeFields]);

  const isNew = typeof edgeId === "undefined";
  const defaultValues = useMemo(() => {
    if (isNew)
      return {
        weight: 1,
        isDirected: fullGraph.type !== "undirected",
        attributes: edgeFields.map((nf) => ({
          key: nf.id,
          value: undefined,
          ...pick(nf, ["type", "format", "separator"]),
        })),
      };

    const source = fullGraph.source(edgeId);
    const target = fullGraph.target(edgeId);
    return {
      id: edgeId,
      source,
      target,
      isDirected: fullGraph.isDirected(edgeId),
      attributes: edgeFields.map((nf) => ({
        key: nf.id,
        value: edgeData[edgeId][nf.id],
        ...pick(nf, ["type", "format", "separator"]),
      })),
    };
  }, [edgeData, edgeId, fullGraph, isNew, edgeFields]);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdatedEdgeState>({
    defaultValues,
  });
  const attributes = watch("attributes");
  const submit = useMemo(
    () =>
      handleSubmit((data) => {
        // generate id if not present
        const id: string = data.id || crypto.randomUUID();

        if (!id) {
          setValue("id", id);
          if (edgeData[id])
            notify({
              type: "error",
              title: t("edition.update_edges"),
              message: t("error.unknown"),
            });
          return;
        }

        const allAttributes = {
          ...fromPairs(
            data.attributes
              .filter(({ value }) => value !== "" || value === undefined)
              .map(({ key, value }) => {
                // value are all string because input are all text whatever the data model
                // for now we cast value as number if they are number to help downstream algo to create appropriate data model
                const valueAsNumber = toNumber(value);
                return [key, valueAsNumber ? valueAsNumber : value];
              }),
          ),
          ...pick(data, "label", "color", "weight"),
        };

        // Create new edge:
        if (isNew) {
          try {
            createEdge(id, allAttributes, data.source, data.target, data.isDirected);
            select({ type: "edges", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.create_edges"),
              message: t("edition.create_edges_success"),
            });
            onSubmitted();

            requestAnimationFrame(() => emitter.emit(EVENTS.edgeCreated, { id }));
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.create_edges"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
        // Update existing edge:
        else {
          try {
            updateEdge(id, allAttributes, { directed: data.isDirected });
            select({ type: "edges", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.update_edges"),
              message: t("edition.update_edges_success"),
            });
            onSubmitted();
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.update_edges"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
      }),
    [createEdge, edgeData, emitter, handleSubmit, isNew, notify, onSubmitted, select, setValue, t, updateEdge],
  );

  return {
    submit,
    main: (
      <>
        <div className="panel-block">
          <div>
            <label htmlFor="updateEdge-id" className="form-label">
              {t("graph.model.edges-data.id")}
            </label>
            <input
              type="text"
              id="updateEdge-id"
              className={cx("form-control", errors.id && "is-invalid")}
              disabled={!isNew}
              {...register("id", {
                required: !isNew,
                validate: (value) => !isNew || (!!value && !edgeData[value]) || (!value && isNew),
              })}
            />
            {errors.id && (
              <div className="invalid-feedback">
                {t(`error.form.${errors.id.type === "validate" ? "unique" : errors.id.type}`)}
              </div>
            )}
          </div>
        </div>

        {/* Extremities */}
        <div className="panel-block">
          <div>
            <label htmlFor="updateEdge-source" className="form-label">
              {t("graph.model.edges-data.source")}
            </label>
            <Controller
              control={control}
              name="source"
              rules={{
                required: true,
                validate: (value) => value in layout,
              }}
              render={({ field: { onChange, value } }) => (
                <GraphSearch
                  onChange={(option) => {
                    if (option === null || "id" in option) {
                      onChange(option?.id);
                    }
                  }}
                  value={typeof value === "string" ? { type: "nodes", id: value } : null}
                  type="nodes"
                />
              )}
            />
            {errors.source && <div className="invalid-feedback">{t(`error.form.${errors.source.type}`)}</div>}
          </div>
          <div>
            <label htmlFor="updateEdge-target" className="form-label">
              {t("graph.model.edges-data.target")}
            </label>
            <Controller
              control={control}
              name="target"
              rules={{
                required: true,
                validate: (value) => value in layout,
              }}
              render={({ field: { onChange, value } }) => (
                <GraphSearch
                  onChange={(option) => {
                    if (option === null || "id" in option) {
                      onChange(option?.id);
                    }
                  }}
                  value={typeof value === "string" ? { type: "nodes", id: value } : null}
                  type="nodes"
                />
              )}
            />
            {errors.target && <div className="invalid-feedback">{t(`error.form.${errors.target.type}`)}</div>}
          </div>
        </div>
        {fullGraph.type === "mixed" && (
          <div>
            <Controller
              control={control}
              name="isDirected"
              rules={{
                required: false,
              }}
              render={({ field: { onChange, value } }) => (
                <Select<{ label: string; value: string }>
                  value={
                    value
                      ? { label: t("graph.model.directed"), value: "directed" }
                      : { label: t("graph.model.undirected"), value: "undirected" }
                  }
                  options={[
                    { label: t("graph.model.directed"), value: "directed" },
                    { label: t("graph.model.undirected"), value: "undirected" },
                  ]}
                  onChange={(selected) => {
                    if (selected) {
                      onChange(selected.value === "directed");
                    }
                  }}
                />
              )}
            />
          </div>
        )}

        {/* Other attributes */}
        <div className="panel-block">
          {attributes.map((field, i) => (
            <div key={i}>
              <div key={i}>
                <label htmlFor={`edge-${edgeId}-field-${i}`} className="form-label">
                  <FieldModelIcon type={edgeFieldsIndex[field.key].type} /> {field.key}
                </label>
                <Controller
                  name={`attributes.${i}.value`}
                  control={control}
                  render={(props) => (
                    <EditItemAttribute
                      id={`edge-${edgeId}-field-${i}`}
                      field={edgeFieldsIndex[field.key]}
                      scalar={props.field.value}
                      onChange={(v) => props.field.onChange(v)}
                    />
                  )}
                />
                {(errors.attributes || [])[i]?.key && (
                  <div className="invalid-feedback">
                    {t(
                      `error.form.${
                        (errors.attributes || [])[i]?.key?.type === "validate"
                          ? "unique"
                          : (errors.attributes || [])[i]?.key?.type
                      }`,
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    footer: (
      <div className="gl-actions">
        <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
          <CancelIcon />
        </button>

        <button type="submit" className="gl-btn gl-btn-fill">
          {isNew ? t("edition.create_edges") : t("edition.update_edges")}
        </button>
      </div>
    ),
  };
};

export const EditEdgeModal: FC<ModalProps<{ edgeId?: string }>> = ({ cancel, submit, arguments: { edgeId } }) => {
  const { t } = useTranslation();
  const isNew = typeof edgeId === "undefined";
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditEdgeForm({
    edgeId,
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
  });

  return (
    <Modal
      title={isNew ? t("edition.create_edges") : t("edition.update_edges")}
      onClose={() => cancel()}
      className="modal-lg edit-edge"
      onSubmit={submitForm}
    >
      <div className="d-flex flex-column gl-gap-3">{main}</div>

      {footer}
    </Modal>
  );
};

export const EditEdgeForm: FC<{
  edgeId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}> = ({ edgeId, onSubmitted, onCancel }) => {
  const { t } = useTranslation();
  const isNew = typeof edgeId === "undefined";
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditEdgeForm({
    edgeId,
    onSubmitted,
    onCancel,
  });

  return (
    <form className="panel-wrapper" onSubmit={submitForm}>
      <div className="panel-body">
        <h2>{isNew ? t("edition.create_edges") : t("edition.update_edges")}</h2>
        {main}
      </div>

      <div className="panel-footer">{footer}</div>
    </form>
  );
};

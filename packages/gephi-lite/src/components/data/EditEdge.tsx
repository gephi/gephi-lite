import { FieldModelTypeSpec, toNumber } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, keyBy, pick } from "lodash";
import { FC, ReactNode, useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { useRemoteFileFreshnessCheck } from "../../core/cloud/useRemoteFileGuard";
import {
  useGraphDataset,
  useGraphDatasetActions,
  useSearchQuery,
  useSelectionActions,
} from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { focusCameraOnEdges, requestFocusOnReady } from "../../core/sigma";
import { Scalar } from "../../core/types";
import { GraphSearch } from "../GraphSearch";
import { CancelIcon, FieldModelIcon, SwapIcon, WarningIcon } from "../common-icons";
import { Select } from "../forms/Select";
import { Modal } from "../modals";
import {
  EditItemAttribute,
  getFirstEmptyValueIndex,
  isEmptyFieldValue,
  isValidFieldValue,
  toFormFieldValue,
} from "./Attribute";
import { EdgeComponentById } from "./Edge";

interface UpdatedEdgeState {
  id: string;
  source: string;
  target: string;
  isDirected: boolean;
  attributes: ({ key: string; value: Scalar } & FieldModelTypeSpec)[];
}

// One or more edges already connect the selected source & target (in either direction): surfaced
// so the user notices before creating an accidental duplicate. Clicking cancels the creation and
// selects/locates the existing edge(s) instead.
const DuplicateEdgeWarning: FC<{ edgeIds: string[]; onClick: () => void }> = ({ edgeIds, onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      className="gl-alert-warning rounded gl-p-2 mt-1"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center gl-gap-1 mb-1">
        <WarningIcon />
        <span>{t("edition.duplicate_edge_warning", { count: edgeIds.length })}</span>
      </div>
      <ul className="list-unstyled mb-0 d-flex flex-column gl-gap-1">
        {edgeIds.map((id) => (
          <li key={id}>
            <EdgeComponentById id={id} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const useEditEdgeForm = ({
  edgeId,
  source: initialSource,
  target: initialTarget,
  onSubmitted,
  onCancel,
  submitLabel,
  submitFirst,
}: {
  edgeId?: string;
  source?: string;
  target?: string;
  onSubmitted: () => void;
  onCancel: () => void;
  // The modal usage (see EditEdgeModal) also shows a copy of this same submit button in its
  // header, since on mobile the on-screen keyboard can cover the footer while a field is focused;
  // there, it overrides the label to a short "OK" and is placed before the cancel button, to match
  // the header's [submit, close] order.
  submitLabel?: ReactNode;
  submitFirst?: boolean;
}) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { emitter } = useEventsContext();
  const { select } = useSelectionActions();
  const { createEdge, updateEdge } = useGraphDatasetActions();
  const { edgeData, layout, fullGraph, edgeFields: allEdgeFields } = useGraphDataset();
  // Read-only (eg. system date) and formula (scripted) fields are managed automatically, so they
  // are not editable through this form:
  const edgeFields = useMemo(() => allEdgeFields.filter((ef) => !ef.readOnly && !ef.script), [allEdgeFields]);
  const edgeFieldsIndex = useMemo(() => keyBy(edgeFields, "id"), [edgeFields]);
  const searchQuery = useSearchQuery();

  const isNew = typeof edgeId === "undefined";
  const defaultValues = useMemo(() => {
    if (isNew)
      return {
        source: initialSource,
        target: initialTarget,
        isDirected: fullGraph.type !== "undirected",
        attributes: edgeFields.map((nf) => ({
          key: nf.id,
          value: nf.defaultValue,
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
  }, [edgeData, edgeId, fullGraph, isNew, edgeFields, initialSource, initialTarget]);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<UpdatedEdgeState>({
    defaultValues,
  });
  const attributes = watch("attributes");
  const source = watch("source");
  const target = watch("target");
  const location = useLocation();
  const navigate = useNavigate();

  // Any edge already connecting these two nodes, in either direction (graphology's `edges(a, b)`
  // already checks both, see its `in`/`out` adjacencies):
  const existingEdgeIds = useMemo(() => {
    if (!isNew || !source || !target || !fullGraph.hasNode(source) || !fullGraph.hasNode(target)) return [];
    return fullGraph.edges(source, target);
  }, [isNew, source, target, fullGraph]);

  const selectExistingEdges = useCallback(() => {
    select({ type: "edges", items: new Set(existingEdgeIds), replace: true });
    // Only focus right away if already on the graph page: navigating there (even by "replace",
    // see useLocateInGraph) only remounts sigma - and thus replays a pending focus - when it
    // wasn't already mounted.
    if (location.pathname === "/") {
      focusCameraOnEdges(existingEdgeIds);
    } else {
      requestFocusOnReady("edges", existingEdgeIds[0]);
      navigate("/", { replace: true });
    }
    onCancel();
  }, [select, existingEdgeIds, location.pathname, navigate, onCancel]);

  // Autofocus the first empty field on mount, in render order (source, target, attributes, then
  // id): computed once from the initial values, so filling a field never steals focus elsewhere.
  const autoFocusIndex = useMemo(() => {
    const {
      source: defaultSource,
      target: defaultTarget,
      attributes: defaultAttributes,
      id,
    } = defaultValues as UpdatedEdgeState;
    return getFirstEmptyValueIndex([defaultSource, defaultTarget, ...defaultAttributes.map((a) => a.value), id]);
  }, [defaultValues]);

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

        const allAttributes = fromPairs(
          data.attributes.map(({ key, value }) => {
            // An emptied field is written back as undefined rather than skipped: updateEdge merges
            // into the existing data, so dropping the key would silently keep the previous value and
            // make clearing a field impossible to save.
            if (isEmptyFieldValue(value)) return [key, undefined];
            // value are all string because input are all text whatever the data model
            // for now we cast value as number if they are number to help downstream algo to create appropriate data model
            const valueAsNumber = toNumber(value);
            return [key, valueAsNumber ? valueAsNumber : value];
          }),
        );

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
            updateEdge(id, allAttributes, { directed: data.isDirected, source: data.source, target: data.target });
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
                  autoFocus={autoFocusIndex === 0}
                  defaultInputValue={isNew && !initialSource ? searchQuery : undefined}
                />
              )}
            />
            {errors.source && <div className="invalid-feedback">{t(`error.form.${errors.source.type}`)}</div>}
          </div>
          <div className="d-flex justify-content-center">
            <button
              type="button"
              className="gl-btn gl-btn-icon gl-btn-outline"
              title={t("edition.swap_extremities")}
              aria-label={t("edition.swap_extremities")}
              onClick={() => {
                const { source, target } = getValues();
                setValue("source", target);
                setValue("target", source);
              }}
            >
              <SwapIcon />
            </button>
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
                  autoFocus={autoFocusIndex === 1}
                />
              )}
            />
            {errors.target && <div className="invalid-feedback">{t(`error.form.${errors.target.type}`)}</div>}
          </div>
        </div>

        {isNew && existingEdgeIds.length > 0 && (
          <DuplicateEdgeWarning edgeIds={existingEdgeIds} onClick={selectExistingEdges} />
        )}

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
                  // Validity is only checked here, on submit: while typing, an incomplete entry (a
                  // URL half written...) must never be fought or wiped, see castScalarToEditableValue.
                  rules={{ validate: (value) => isValidFieldValue(value, edgeFieldsIndex[field.key]) }}
                  render={(props) => (
                    <EditItemAttribute
                      id={`edge-${edgeId}-field-${i}`}
                      clearable
                      field={edgeFieldsIndex[field.key]}
                      scalar={props.field.value}
                      onChange={(v) => props.field.onChange(toFormFieldValue(v))}
                      autoFocus={2 + i === autoFocusIndex}
                    />
                  )}
                />
                {(errors.attributes || [])[i]?.value && (
                  <div className="text-danger">
                    {t("error.form.invalid_value", { type: edgeFieldsIndex[field.key].type })}
                  </div>
                )}
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

        {/* ID */}
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
              autoComplete="off"
              autoFocus={2 + attributes.length === autoFocusIndex}
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
      </>
    ),
    footer: (
      <div className="gl-actions">
        {submitFirst && (
          <button type="submit" className="gl-btn gl-btn-fill">
            {submitLabel ?? (isNew ? t("edition.create_edges") : t("edition.update_edges"))}
          </button>
        )}
        <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
          <CancelIcon />
        </button>
        {!submitFirst && (
          <button type="submit" className="gl-btn gl-btn-fill">
            {submitLabel ?? (isNew ? t("edition.create_edges") : t("edition.update_edges"))}
          </button>
        )}
      </div>
    ),
  };
};

export const EditEdgeModal: FC<ModalProps<{ edgeId?: string; source?: string; target?: string }>> = ({
  cancel,
  submit,
  arguments: { edgeId, source, target },
}) => {
  const { t } = useTranslation();
  const isNew = typeof edgeId === "undefined";

  // Probe the remote GitHub version as soon as the popup opens, so the user is warned before
  // filling it in (rather than only when validating), avoiding losing their input on a reload.
  const { check: checkRemoteFreshness } = useRemoteFileFreshnessCheck();
  useEffect(() => checkRemoteFreshness(), [checkRemoteFreshness]);

  const {
    main,
    footer,
    submit: submitForm,
  } = useEditEdgeForm({
    edgeId,
    source,
    target,
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
    submitLabel: t("common.ok"),
    submitFirst: true,
  });

  return (
    <Modal
      title={isNew ? t("edition.create_edges") : t("edition.update_edges")}
      onClose={() => cancel()}
      className="modal-lg edit-edge"
      onSubmit={submitForm}
      submitLabel={t("common.ok")}
      doNotPreserveData
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

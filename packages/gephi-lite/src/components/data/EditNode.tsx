import { FieldModelTypeSpec, NodeCoordinates, Scalar, toNumber } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, keyBy, pick } from "lodash";
import { FC, ReactNode, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useRemoteFileFreshnessCheck } from "../../core/cloud/useRemoteFileGuard";
import {
  useAppearance,
  useGraphDataset,
  useGraphDatasetActions,
  useSearch,
  useSearchQuery,
  useSelectionActions,
} from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { CancelIcon, FieldModelIcon, WarningIcon } from "../common-icons";
import { Modal } from "../modals";
import {
  EditItemAttribute,
  getFirstEmptyValueIndex,
  isEmptyFieldValue,
  isValidFieldValue,
  toFormFieldValue,
} from "./Attribute";
import { NodeComponentById } from "./Node";

// Existing nodes whose name (the current label field, or the id as a fallback) fuzzy-matches what
// is being typed for a new node: surfaced so the user notices before creating an accidental
// duplicate. Clicking one cancels the creation and locates that existing node instead, exactly
// like picking a result from the main fuzzy search box.
const SimilarNodesWarning: FC<{ nodeIds: string[]; onPick: () => void }> = ({ nodeIds, onPick }) => {
  const { t } = useTranslation();
  return (
    <div className="gl-alert-warning rounded gl-p-2 mt-1" role="alert">
      <div className="d-flex align-items-center gl-gap-1 mb-1">
        <WarningIcon />
        <span>{t("edition.similar_nodes_warning")}</span>
      </div>
      <ul className="list-unstyled mb-0 d-flex flex-column gl-gap-1" onClick={onPick}>
        {nodeIds.map((id) => (
          <li key={id}>
            <NodeComponentById id={id} locatable />
          </li>
        ))}
      </ul>
    </div>
  );
};

interface UpdatedNodeState extends NodeCoordinates {
  id?: string;
  attributes: ({ key: string; value: Scalar } & FieldModelTypeSpec)[];
}

const useEditNodeForm = ({
  nodeId,
  onSubmitted,
  onCancel,
  submitLabel,
  submitFirst,
}: {
  nodeId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
  // The modal usage (see EditNodeModal) also shows a copy of this same submit button in its
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
  const { createNode, updateNode } = useGraphDatasetActions();
  const { nodeData, layout, nodeFields: allNodeFields } = useGraphDataset();
  // Read-only (eg. system date) and formula (scripted) fields are managed automatically, so they
  // are not editable through this form:
  const nodeFields = useMemo(() => allNodeFields.filter((nf) => !nf.readOnly && !nf.script), [allNodeFields]);
  const nodeFieldsIndex = useMemo(() => keyBy(nodeFields, "id"), [nodeFields]);

  // Which field currently drives the node label (falling back to the id, when there is no label
  // field configured): used both to fuzzy-match similar existing nodes below, and to pre-fill a
  // new node's label with whatever was typed in the main fuzzy search box before hitting "+".
  const { nodesLabel } = useAppearance();
  const labelFieldId = nodesLabel.type === "field" ? nodesLabel.field.id : "id";
  const searchQuery = useSearchQuery();

  const isNew = typeof nodeId === "undefined";
  const defaultValues = useMemo(() => {
    if (isNew)
      return {
        x: 0,
        y: 0,
        id: labelFieldId === "id" ? searchQuery || undefined : undefined,
        attributes: nodeFields.map((nf) => ({
          key: nf.id,
          value: nf.id === labelFieldId && searchQuery ? searchQuery : nf.defaultValue,
          ...pick(nf, ["type", "format", "separator"]),
        })),
      };

    return {
      id: nodeId,
      ...layout[nodeId],
      attributes: nodeFields.map((nf) => ({
        key: nf.id,
        value: nodeData[nodeId][nf.id],
        ...pick(nf, ["type", "format", "separator"]),
      })),
    };
  }, [isNew, nodeId, layout, nodeData, nodeFields, labelFieldId, searchQuery]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdatedNodeState>({
    defaultValues,
  });
  const attributes = watch("attributes");
  const idValue = watch("id");

  // Fuzzy-match existing nodes' names against what is being typed for this new node, using the
  // same search index (and settings) as the main search box.
  const { index } = useSearch();
  // Extracted as a scalar (rather than depending on the whole `attributes` array below) because
  // react-hook-form's `watch("attributes")` can mutate the same array reference in place instead
  // of returning a fresh one, which would make the memo below miss the update.
  const labelAttrValue = attributes.find((a) => a.key === labelFieldId)?.value;
  const nameQuery = useMemo(() => {
    if (!isNew) return "";
    if (labelFieldId === "id") return idValue || "";
    return labelAttrValue != null ? String(labelAttrValue) : "";
  }, [isNew, labelFieldId, idValue, labelAttrValue]);
  const similarNodeIds = useMemo(() => {
    if (nameQuery.trim().length < 2) return [];
    return index
      .search(nameQuery, { prefix: true, fuzzy: 0.2, filter: (result) => result.type === "nodes" })
      .slice(0, 5)
      .map((result) => result.id as string);
  }, [nameQuery, index]);

  // Autofocus the first empty field on mount, in render order (attributes, then position, then
  // id): computed once from the initial values, so filling a field never steals focus elsewhere.
  const autoFocusIndex = useMemo(() => {
    const { attributes: defaultAttributes, x, y, id } = defaultValues as UpdatedNodeState;
    return getFirstEmptyValueIndex([...defaultAttributes.map((a) => a.value), x, y, id]);
  }, [defaultValues]);

  const submit = useMemo(
    () =>
      handleSubmit((data) => {
        // generate id if not present
        const id: string = data.id || crypto.randomUUID();

        if (!id) {
          setValue("id", id);
          if (nodeData[id])
            notify({
              type: "error",
              title: t("edition.update_nodes"),
              message: t("error.unknown"),
            });
          return;
        }

        const allAttributes = {
          ...fromPairs(
            data.attributes.map(({ key, value }) => {
              // An emptied field is written back as undefined rather than skipped: updateNode merges
              // into the existing data, so dropping the key would silently keep the previous value
              // and make clearing a field impossible to save.
              if (isEmptyFieldValue(value)) return [key, undefined];
              // value are all string because input are all text whatever the data model
              // for now we cast value as number if they are number to help downstream algo to create appropriate data model
              const valueAsNumber = toNumber(value);
              return [key, valueAsNumber ? valueAsNumber : value];
            }),
          ),
          ...pick(data, "x", "y"),
        };

        // Create new node:
        if (isNew) {
          try {
            createNode(id, allAttributes);
            select({ type: "nodes", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.create_nodes"),
              message: t("edition.create_nodes_success"),
            });
            onSubmitted();

            requestAnimationFrame(() => emitter.emit(EVENTS.nodeCreated, { id }));
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.create_nodes"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
        // Update existing node:
        else {
          try {
            updateNode(id, allAttributes);
            select({ type: "nodes", items: new Set([id]), replace: true });
            notify({
              type: "success",
              title: t("edition.update_nodes"),
              message: t("edition.update_nodes_success"),
            });
            onSubmitted();
          } catch (e) {
            notify({
              type: "error",
              title: t("edition.update_nodes"),
              message: (e as Error).message || t("error.unknown"),
            });
          }
        }
      }),
    [createNode, emitter, handleSubmit, isNew, nodeData, notify, onSubmitted, select, setValue, t, updateNode],
  );

  return {
    submit,
    main: (
      <>
        {/* Other attributes */}
        <div className="panel-block">
          {attributes.map((field, i) => (
            <div key={i}>
              <label htmlFor={`node-${nodeId}-field-${i}`} className="form-label">
                <FieldModelIcon type={nodeFieldsIndex[field.key].type} /> {field.key}
              </label>
              <Controller
                name={`attributes.${i}.value`}
                control={control}
                // Validity is only checked here, on submit: while typing, an incomplete entry (a URL
                // half written...) must never be fought or wiped, see castScalarToEditableValue.
                rules={{ validate: (value) => isValidFieldValue(value, nodeFieldsIndex[field.key]) }}
                render={(props) => (
                  <EditItemAttribute
                    id={`node-${nodeId}-field-${i}`}
                    clearable
                    field={nodeFieldsIndex[field.key]}
                    scalar={props.field.value}
                    onChange={(v) => props.field.onChange(toFormFieldValue(v))}
                    autoFocus={i === autoFocusIndex}
                  />
                )}
              />
              {(errors.attributes || [])[i]?.value && (
                <div className="text-danger">
                  {t("error.form.invalid_value", { type: nodeFieldsIndex[field.key].type })}
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
              {isNew && field.key === labelFieldId && similarNodeIds.length > 0 && (
                <SimilarNodesWarning nodeIds={similarNodeIds} onPick={onCancel} />
              )}
            </div>
          ))}
        </div>

        {/* Position */}
        <div className="panel-block">
          <div>
            <label htmlFor="updateNode-x" className="form-label">
              {t("graph.model.nodes-data.x")}
            </label>
            <input
              type="number"
              id="updateNode-x"
              className={cx("form-control", errors.x && "is-invalid")}
              step="any"
              autoComplete="off"
              autoFocus={attributes.length === autoFocusIndex}
              {...register("x")}
            />
          </div>
          <div>
            <label htmlFor="updateNode-y" className="form-label">
              {t("graph.model.nodes-data.y")}
            </label>
            <input
              type="number"
              id="updateNode-y"
              className={cx("form-control", errors.y && "is-invalid")}
              step="any"
              autoComplete="off"
              autoFocus={attributes.length + 1 === autoFocusIndex}
              {...register("y")}
            />
          </div>
        </div>

        {/* ID */}
        <div className="panel-block">
          <div>
            <label htmlFor="updateNode-id" className="form-label">
              {t("graph.model.nodes-data.id")}
            </label>
            <input
              type="text"
              id="updateNode-id"
              className={cx("form-control", errors.id && "is-invalid")}
              disabled={!isNew}
              autoComplete="off"
              autoFocus={attributes.length + 2 === autoFocusIndex}
              {...register("id", {
                required: !isNew,
                validate: (value) => !isNew || (!!value && !nodeData[value]) || (!value && isNew),
              })}
            />
            {errors.id && (
              <div className="invalid-feedback">
                {t(`error.form.${errors.id.type === "validate" ? "unique" : errors.id.type}`)}
              </div>
            )}
            {isNew && labelFieldId === "id" && similarNodeIds.length > 0 && (
              <SimilarNodesWarning nodeIds={similarNodeIds} onPick={onCancel} />
            )}
          </div>
        </div>
      </>
    ),
    footer: (
      <div className="gl-actions">
        {submitFirst && (
          <button type="submit" className="gl-btn gl-btn-fill">
            {submitLabel ?? (isNew ? t("edition.create_nodes") : t("edition.update_nodes"))}
          </button>
        )}
        <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
          <CancelIcon />
        </button>
        {!submitFirst && (
          <button type="submit" className="gl-btn gl-btn-fill">
            {submitLabel ?? (isNew ? t("edition.create_nodes") : t("edition.update_nodes"))}
          </button>
        )}
      </div>
    ),
  };
};

export const EditNodeModal: FC<ModalProps<{ nodeId?: string }>> = ({ cancel, submit, arguments: { nodeId } }) => {
  const { t } = useTranslation();
  const isNew = typeof nodeId === "undefined";

  // Probe the remote GitHub version as soon as the popup opens, so the user is warned before
  // filling it in (rather than only when validating), avoiding losing their input on a reload.
  const { check: checkRemoteFreshness } = useRemoteFileFreshnessCheck();
  useEffect(() => checkRemoteFreshness(), [checkRemoteFreshness]);

  const {
    main,
    footer,
    submit: submitForm,
  } = useEditNodeForm({
    nodeId,
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
    submitLabel: t("common.ok"),
    submitFirst: true,
  });

  return (
    <Modal
      title={isNew ? t("edition.create_nodes") : t("edition.update_nodes")}
      onClose={() => cancel()}
      className="modal-lg edit-node"
      onSubmit={submitForm}
      submitLabel={t("common.ok")}
      doNotPreserveData
    >
      <div className="d-flex flex-column gl-gap-3">{main}</div>

      {footer}
    </Modal>
  );
};

export const EditNodeForm: FC<{
  nodeId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
}> = ({ nodeId, onSubmitted, onCancel }) => {
  const { t } = useTranslation();
  const isNew = typeof nodeId === "undefined";
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditNodeForm({
    nodeId,
    onSubmitted,
    onCancel,
  });

  return (
    <form className="panel-wrapper" onSubmit={submitForm}>
      <div className="panel-body">
        <h2>{isNew ? t("edition.create_nodes") : t("edition.update_nodes")}</h2>
        {main}
      </div>

      <div className="panel-footer">{footer}</div>
    </form>
  );
};

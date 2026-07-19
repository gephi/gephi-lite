import { FieldModelTypeSpec, NodeCoordinates, Scalar, toNumber } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, keyBy, pick } from "lodash";
import { FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useGraphDataset,
  useGraphDatasetActions,
  useSearch,
  useSelectionActions,
} from "../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../core/context/eventsContext";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { CancelIcon, FieldModelIcon, WarningIcon } from "../common-icons";
import { Modal } from "../modals";
import { EditItemAttribute, getFirstEmptyValueIndex } from "./Attribute";
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
}: {
  nodeId?: string;
  onSubmitted: () => void;
  onCancel: () => void;
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

  const isNew = typeof nodeId === "undefined";
  const defaultValues = useMemo(() => {
    if (isNew)
      return {
        x: 0,
        y: 0,
        attributes: nodeFields.map((nf) => ({
          key: nf.id,
          value: nf.defaultValue,
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
  }, [isNew, nodeId, layout, nodeData, nodeFields]);
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
  // same search index (and settings) as the main search box: reuses the field currently used as
  // the node label (falling back to the id, when there is no label field configured).
  const { nodesLabel } = useAppearance();
  const { index } = useSearch();
  const labelFieldId = nodesLabel.type === "field" ? nodesLabel.field.id : "id";
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
            data.attributes
              .filter(({ value }) => value !== "" || value === undefined)
              .map(({ key, value }) => {
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
                render={(props) => (
                  <EditItemAttribute
                    id={`node-${nodeId}-field-${i}`}
                    field={nodeFieldsIndex[field.key]}
                    scalar={props.field.value}
                    onChange={(v) => props.field.onChange(v)}
                    autoFocus={i === autoFocusIndex}
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
        <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
          <CancelIcon />
        </button>

        <button type="submit" className="gl-btn gl-btn-fill">
          {isNew ? t("edition.create_nodes") : t("edition.update_nodes")}
        </button>
      </div>
    ),
  };
};

export const EditNodeModal: FC<ModalProps<{ nodeId?: string }>> = ({ cancel, submit, arguments: { nodeId } }) => {
  const { t } = useTranslation();
  const isNew = typeof nodeId === "undefined";
  const {
    main,
    footer,
    submit: submitForm,
  } = useEditNodeForm({
    nodeId,
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
  });

  return (
    <Modal
      title={isNew ? t("edition.create_nodes") : t("edition.update_nodes")}
      onClose={() => cancel()}
      className="modal-lg edit-node"
      onSubmit={submitForm}
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

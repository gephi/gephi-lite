import { FieldModel, FullGraph, ItemData, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { graphDatasetAtom } from "../../core/graph";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { inferFieldType } from "../../core/graph/fieldModel";
import { dataGraphToFullGraph } from "../../core/graph/utils";
import { ModalProps } from "../../core/modals/types";
import { useNotifications } from "../../core/notifications";
import { isScalar } from "../../utils/check";
import { CancelIcon } from "../common-icons";
import { Modal } from "../modals";
import { useFunctionEditor } from "../modals/FunctionEditor";

export type CreateScriptedFieldModelFormProps = {
  fullEditor: boolean;
  onSubmitted: () => void;
  onCancel: () => void;
  type: ItemType;
  insertAt?: { id: string; pos: "before" | "after" };
  // When set, the form edits the script of an existing formula field instead of creating a new one:
  fieldModelId?: string;
};

type ScriptedFieldModelFunction = (id: string, attributes: ItemData, index: number, graph: FullGraph) => Scalar;

const BASE_JS = {
  nodes: {
    doc: `/**
* Function that return the metric value for the specified node.
*
* @param {string} id The ID of the node
* @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the node
* @param {number} index The index position of the node in the graph
* @param {Graph} graph The graphology instance (documentation: https://graphology.github.io/)
* @returns number|string The computed metric of the node
*/`,
    baseFn: `function nodeMetric(id, attributes, index, graph) {
  // Your code goes here
  return Math.random();
}`,
    check: (fn: ScriptedFieldModelFunction) => {
      if (!fn) throw new Error("Function is not defined");
      const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
      const id = fullGraph.nodes()[0];
      const attributs = fullGraph.getNodeAttributes(id);
      const result = fn(id, attributs, 0, fullGraph);
      if (!isScalar(result)) throw new Error("Function must returns a number, a string, a boolean, null or undefined");
    },
  },
  edges: {
    doc: `/**
* Function that return the metric value for the specified edge.
*
* @param {string} id The ID of the edge
* @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the node
* @param {number} index The index position of the node in the graph
* @param {Graph} graph The graphology instance (documentation: https://graphology.github.io/)
* @returns number|string The computed metric of the edge
*/`,
    baseFn: `function edgeMetric(id, attributes, index, graph) {
  // Your code goes here
  return Math.random();
}`,
    check: (fn: ScriptedFieldModelFunction) => {
      if (!fn) throw new Error("Function is not defined");
      const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
      const id = fullGraph.edges()[0];
      const attributes = fullGraph.getEdgeAttributes(id);
      const result = fn(id, attributes, 0, fullGraph);
      if (!isScalar(result)) throw new Error("Function must returns a number, a string, a boolean, null or undefined");
    },
  },
};

export const useCreateScriptedFieldModelForm = ({
  onCancel,
  onSubmitted,
  type,
  insertAt,
  fieldModelId,
}: CreateScriptedFieldModelFormProps) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const dataset = useGraphDataset();
  const { nodesLabel, edgesLabel } = useAppearance();
  const { createFieldModel, setFieldModel } = useGraphDatasetActions();
  const { nodeFields, edgeFields } = dataset;
  const fields = type === "nodes" ? nodeFields : edgeFields;

  // Which attribute currently drives the node/edge display label (Appearance "Set label from..."):
  // surfaced above the label input, read-only, so the user sees how this field's label relates to
  // what is actually displayed on the graph.
  const currentDisplayLabel = useMemo(() => {
    const attr = type === "nodes" ? nodesLabel : edgesLabel;
    if (attr.type === "field") return staticDynamicAttributeLabel(attr.field);
    if (attr.type === "fixed") return attr.value;
    return t("appearance.labels.none");
  }, [type, nodesLabel, edgesLabel, t]);

  // Edit mode: we are changing the script of an existing formula field.
  const editedField = useMemo(() => fields.find((f) => f.id === fieldModelId), [fields, fieldModelId]);
  const isEditing = !!editedField;

  const checkFunction = useCallback(
    (fn: ScriptedFieldModelFunction) => {
      if (!fn) throw new Error("Function is not defined");

      const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
      const id = fullGraph[type]()[0];
      const attributs = type === "nodes" ? fullGraph.getNodeAttributes(id) : fullGraph.getEdgeAttributes(id);
      const result = fn(id, attributs, 0, fullGraph);
      if (!isScalar(result)) throw new Error("Function must returns a number, a string, a boolean, null or undefined");
    },
    [type],
  );

  const [newId, setNewId] = useState<string>(editedField?.id ?? "");
  const [newLabel, setNewLabel] = useState<string>(editedField?.label ?? "");

  const existingField = useMemo(
    () => (isEditing ? undefined : fields.find((f) => f.id === newId)),
    [fields, isEditing, newId],
  );
  const isFormValid = useMemo(() => !!newId && !existingField, [existingField, newId]);

  const onSubmit = useCallback(
    (script: ScriptedFieldModelFunction) => {
      try {
        // The values are NOT stored: the script is persisted in the field model and recomputed on
        // the fly. We still run it once over the whole graph to validate it and infer the field type.
        const graph: FullGraph = dataGraphToFullGraph(dataset);
        Object.freeze(graph);

        const ids = type === "nodes" ? graph.nodes() : graph.edges();
        const sampleValues: Scalar[] = ids.map((id, index) =>
          script(id, type === "nodes" ? graph.getNodeAttributes(id) : graph.getEdgeAttributes(id), index, graph),
        );

        const fieldModel: FieldModel = {
          id: newId,
          itemType: type,
          label: newLabel || undefined,
          script,
          ...inferFieldType(newId, sampleValues, sampleValues.length),
        };

        if (isEditing) {
          setFieldModel(fieldModel);
        } else {
          const index = insertAt
            ? fields.findIndex((f) => f.id === insertAt.id) + (insertAt.pos === "before" ? -1 : 1)
            : undefined;
          createFieldModel(fieldModel, { index });
        }
        notify({
          type: "success",
          title: t(`edition.${isEditing ? "update" : "create"}_${type}_scripted_field`),
          message: t(`edition.${isEditing ? "update" : "create"}_${type}_scripted_field_success`),
        });
      } catch (e) {
        notify({
          type: "error",
          title: t(`edition.${isEditing ? "update" : "create"}_${type}_scripted_field`),
          message: (e as Error).message || t("error.unknown"),
        });
      }
      if (onSubmitted) onSubmitted();
    },
    [
      createFieldModel,
      dataset,
      fields,
      insertAt,
      isEditing,
      newId,
      newLabel,
      notify,
      onSubmitted,
      setFieldModel,
      t,
      type,
    ],
  );
  const { content: editorContent, getFunction } = useFunctionEditor<ScriptedFieldModelFunction>({
    checkFunction,
    functionJsDoc: BASE_JS[type].doc,
    initialFunctionCode: editedField?.script?.toString() ?? BASE_JS[type].baseFn,
    onSubmit: isFormValid ? onSubmit : undefined,
    saveAndRunI18nKey: isEditing ? "datatable.save_and_update_column" : "datatable.save_and_create_column",
  });
  const submit = useCallback(() => {
    const fn = getFunction();
    if (fn && isFormValid) onSubmit(fn);
  }, [getFunction, isFormValid, onSubmit]);

  return {
    submit,
    main: (
      <div className="panel-body">
        <h2>{t(`edition.${isEditing ? "update" : "create"}_${type}_scripted_field`)}</h2>

        <div className="panel-block">
          <label htmlFor="column-id" className="form-label">
            {t("graph.model.field.id")}
          </label>
          <input
            required
            type="text"
            id="column-id"
            className={cx("form-control", existingField && "is-invalid")}
            value={newId}
            disabled={isEditing}
            onChange={(e) => setNewId(e.target.value)}
          />
          {existingField && (
            <div className="invalid-feedback">
              {t(`error.form.field_already_exists`, {
                id: existingField.id,
                label: existingField.label || existingField.id,
              })}
            </div>
          )}
        </div>

        <div className="panel-block">
          <label htmlFor="column-label" className="form-label">
            {currentDisplayLabel}
          </label>
          <input
            type="text"
            id="column-label"
            className="form-control"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
        </div>

        {editorContent}
      </div>
    ),
    footer: (
      <div className="panel-footer">
        <div className="gl-actions">
          <button type="button" className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onCancel()}>
            <CancelIcon />
          </button>

          <button type="submit" className="gl-btn gl-btn-fill">
            {isEditing ? t("datatable.modify_column") : t("datatable.create_column")}
          </button>
        </div>
      </div>
    ),
  };
};

export const CreateScriptedFieldModelModal: FC<
  ModalProps<Omit<CreateScriptedFieldModelFormProps, "onSubmitted" | "onCancel" | "fullEditor">>
> = ({ cancel, submit, arguments: props }) => {
  const { t } = useTranslation();
  const {
    main,
    footer,
    submit: submitForm,
  } = useCreateScriptedFieldModelForm({
    onSubmitted: () => submit({}),
    onCancel: () => cancel(),
    fullEditor: true,
    ...props,
  });

  return (
    <Modal
      title={t(`edition.${props.fieldModelId ? "update" : "create"}_${props.type}_scripted_field`)}
      onClose={() => cancel()}
      className="modal-lg edit-attribute"
      onSubmit={submitForm}
    >
      {main}
      {footer}
    </Modal>
  );
};

export const CreateScriptedFieldModelForm: FC<Omit<CreateScriptedFieldModelFormProps, "fullEditor">> = (props) => {
  const { main, footer, submit: submitForm } = useCreateScriptedFieldModelForm({ ...props, fullEditor: false });

  return (
    <form className="panel-wrapper" onSubmit={submitForm}>
      {main}
      {footer}
    </form>
  );
};

import { FieldModel, FullGraph, ItemData, ItemType, Scalar } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFilteredGraph, useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { graphDatasetAtom } from "../../core/graph";
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
}: CreateScriptedFieldModelFormProps) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const dataset = useGraphDataset();
  const filteredGraph = useFilteredGraph();
  const { createFieldModel } = useGraphDatasetActions();
  const { nodeFields, edgeFields } = dataset;
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

  const [newId, setNewId] = useState<string>("");
  // TODO: Add input for scope
  const [scope, _setScope] = useState<"all" | "filtered" /* | "selected"*/>("all");

  const fields = type === "nodes" ? nodeFields : edgeFields;
  const existingField = useMemo(() => fields.find((f) => f.id === newId), [fields, newId]);
  const isFormValid = useMemo(() => !!newId && !existingField, [existingField, newId]);

  const onSubmit = useCallback(
    (script: ScriptedFieldModelFunction) => {
      try {
        let graph: FullGraph;
        switch (scope) {
          // TODO:
          // case "selected":
          //   graph = dataGraphToFullGraph(dataset, dataset);
          //   break;
          case "filtered":
            graph = dataGraphToFullGraph(dataset, filteredGraph);
            break;
          case "all":
          default:
            graph = dataGraphToFullGraph(dataset);
            // graph = dataGraphToFullGraph(graphDatasetAtom.get());
            break;
        }

        Object.freeze(graph);

        const values: Record<string, Scalar> = {};
        if (type === "nodes") {
          graph.nodes().forEach((id, index) => {
            values[id] = script(id, graph.getNodeAttributes(id), index, graph);
          });
        } else {
          graph.edges().forEach((id, index) => {
            values[id] = script(id, graph.getEdgeAttributes(id), index, graph);
          });
        }

        const valuesArray = Object.values(values);

        const fieldModel: FieldModel = {
          id: newId,
          itemType: type,
          ...inferFieldType(newId, valuesArray, valuesArray.length),
        };
        const index = insertAt
          ? fields.findIndex((f) => f.id === insertAt.id) + (insertAt.pos === "before" ? -1 : 1)
          : undefined;
        createFieldModel(fieldModel, { index, values });
        notify({
          type: "success",
          title: t(`edition.create_${type}_scripted_field`),
          message: t(`edition.create_${type}_scripted_field_success`),
        });
      } catch (e) {
        notify({
          type: "error",
          title: t(`edition.create_${type}_scripted_field`),
          message: (e as Error).message || t("error.unknown"),
        });
      }
      if (onSubmitted) onSubmitted();
    },
    [createFieldModel, dataset, fields, filteredGraph, insertAt, newId, notify, onSubmitted, scope, t, type],
  );
  const { content: editorContent, getFunction } = useFunctionEditor<ScriptedFieldModelFunction>({
    checkFunction,
    functionJsDoc: BASE_JS[type].doc,
    initialFunctionCode: BASE_JS[type].baseFn,
    onSubmit: isFormValid ? onSubmit : undefined,
    saveAndRunI18nKey: "datatable.save_and_create_column",
  });
  const submit = useCallback(() => {
    const fn = getFunction();
    if (fn && isFormValid) onSubmit(fn);
  }, [getFunction, isFormValid, onSubmit]);

  return {
    submit,
    main: (
      <div className="panel-body">
        <h2>{t(`edition.create_${type}_scripted_field`)}</h2>

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
            {t("datatable.create_column")}
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
      title={t(`edition.create_${props.type}_scripted_field`)}
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

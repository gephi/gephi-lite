import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import { isBoolean } from "lodash";

import { ItemType } from "../../core/types";
import { useFiltersActions } from "../../core/context/dataContexts";
import { ScriptFilterType } from "../../core/filters/types";
import { graphDatasetAtom } from "../../core/graph";
import { useModal } from "../../core/modals";
import { ModalProps } from "../../core/modals/types";
import { Modal } from "../../components/modals";
import { CodeEditorIcon } from "../../components/common-icons";

function codeToFunction(code: string, forType: ItemType): ScriptFilterType["script"] {
  if (code.trim().length === 0) throw new Error("Code is required");

  // eslint-disable-next-line no-new-func
  const fn = new Function(`return ( ${code} )`)();

  // Check/test the function
  let id = null;
  let attributs = null;
  const graphDataset = graphDatasetAtom.get();
  if (forType === "nodes" && graphDataset.fullGraph.order > 0) {
    id = graphDataset.fullGraph.nodes()[0];
    attributs = graphDataset.nodeData[id];
  }
  if (forType === "edges" && graphDataset.fullGraph.size > 0) {
    id = graphDataset.fullGraph.edges()[0];
    attributs = graphDataset.edgeData[id];
  }
  const result = fn(id ?? 0, attributs ?? {}, graphDataset);
  if (!isBoolean(result)) throw new Error("Function must returned a boolean");

  return fn;
}

function functionToCode(fn: ScriptFilterType["script"]): string {
  return fn?.toString() || "";
}

export const ScriptFilterEditorModal: FC<ModalProps<{ filter: ScriptFilterType }, ScriptFilterType["script"]>> = (
  props,
) => {
  const { t } = useTranslation();
  const { cancel, submit } = props;
  const { filter } = props.arguments;

  const itemTypeName = filter.itemType === "nodes" ? "node" : "edge";
  const jsDoc = `/**
 * Filtering function.
 *
 * @param {string} id - ID of the item
 * @param {Object.<string, number | string | boolean | undefined | null>} attributes - attributes of the item
 * @param {GraphDataset} dataset - Graph dataset
 * @return {boolean} - TRUE if the item should be kept in the graph, FALSE to filter it
 */`;
  const defaultFunction = `function ${itemTypeName}Filter(id, attributes, graphDataSet) {
  // Your code goes here
  return true;
}`;
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(
    `${jsDoc}\n${filter.script ? functionToCode(filter.script) : defaultFunction}`,
  );

  return (
    <Modal
      className="modal-xl"
      title={
        <>
          <CodeEditorIcon className="me-1" />
          {t("filters.script")} ({t(`graph.model.${filter.itemType}`)})
        </>
      }
      onClose={() => cancel()}
    >
      <>
        {error && <p className="text-danger text-center">{error}</p>}
        <Editor
          height="40vh"
          defaultLanguage="javascript"
          value={code}
          onChange={(e) => {
            setError(null);
            setCode(e || "");
          }}
          options={{
            tabSize: 2,
            minimap: {
              enabled: false,
            },
          }}
        />
      </>
      <>
        <button
          type="button"
          title={t("common.cancel").toString()}
          className="btn btn-secondary"
          onClick={() => cancel()}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          title={t("common.save").toString()}
          className="btn btn-primary"
          onClick={() => {
            try {
              const fn = codeToFunction(code, filter.itemType);
              submit(fn);
            } catch (e) {
              setError(`${e}`);
            }
          }}
        >
          {t("common.save")}
        </button>
      </>
    </Modal>
  );
};

export const ScriptFilter: FC<{ filter: ScriptFilterType; active?: boolean; editMode?: boolean }> = ({
  filter,
  editMode,
  active,
}) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { replaceCurrentFilter } = useFiltersActions();
  return (
    <div>
      <div className="fs-5">
        {t("filters.script")} ({t(`graph.model.${filter.itemType}`)})
      </div>
      {editMode && (
        <div>
          <button
            className="btn btn-secondary mx-auto d-block m-1"
            title={t("common.open_code_editor").toString()}
            onClick={() =>
              openModal({
                component: ScriptFilterEditorModal,
                arguments: { filter },
                beforeSubmit: (fn) => {
                  replaceCurrentFilter({ ...filter, script: fn });
                },
              })
            }
          >
            <CodeEditorIcon className="me-1" /> {t("common.open_code_editor")}
          </button>
        </div>
      )}
    </div>
  );
};

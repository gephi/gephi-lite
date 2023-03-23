import { FC } from "react";
import { useTranslation } from "react-i18next";
import { isBoolean } from "lodash";

import { ItemData, GraphDataset } from "../../core/graph/types";
import { graphDatasetAtom } from "../../core/graph";
import { useFiltersActions } from "../../core/context/dataContexts";
import { ScriptFilterType } from "../../core/filters/types";
import { useModal } from "../../core/modals";
import { CodeEditorIcon } from "../../components/common-icons";
import { FunctionEditorModal } from "../../views/graphPage/modals/FunctionEditorModal";

function nodeFilter(id: string, attributes: ItemData, graphDataSet: GraphDataset) {
  // Your code goes here
  return true;
}
function edgeFilter(id: string, attributes: ItemData, graphDataSet: GraphDataset) {
  // Your code goes here
  return true;
}

const SCRIPT_JS_DOC = `/**
 * Filtering function.
 *
 * @param {string} id ID of the item
 * @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the item
 * @param {GraphDataset} dataset Graph dataset
 * @return {boolean} TRUE if the item should be kept in the graph, FALSE to filter it
 */`;

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
            className="btn btn-outline-dark mx-auto d-block m-1"
            title={t("common.open_code_editor").toString()}
            onClick={() =>
              openModal({
                component: FunctionEditorModal<ScriptFilterType["script"]>,
                arguments: {
                  title: "Custom filter",
                  functionJsDoc: SCRIPT_JS_DOC,
                  defaultFunction: filter.itemType === "nodes" ? nodeFilter : edgeFilter,
                  value: filter.script,
                  checkFunction: (fn) => {
                    if (!fn) throw new Error("Function is not defined");
                    // Check/test the function
                    let id = null;
                    let attributs = null;
                    const graphDataset = graphDatasetAtom.get();
                    if (filter.itemType === "nodes" && graphDataset.fullGraph.order > 0) {
                      id = graphDataset.fullGraph.nodes()[0];
                      attributs = graphDataset.nodeData[id];
                    }
                    if (filter.itemType && graphDataset.fullGraph.size > 0) {
                      id = graphDataset.fullGraph.edges()[0];
                      attributs = graphDataset.edgeData[id];
                    }
                    const result = fn(id ?? "0", attributs ?? {}, graphDataset);
                    if (!isBoolean(result)) throw new Error("Function must returned a boolean");
                  },
                },
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

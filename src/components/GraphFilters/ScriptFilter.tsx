import cx from "classnames";
import { isBoolean } from "lodash";
import { FC } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";

import { useFiltersActions } from "../../core/context/dataContexts";
import { ScriptFilterType } from "../../core/filters/types";
import { graphDatasetAtom, parentFilteredGraphAtom } from "../../core/graph";
import { dataGraphToFullGraph } from "../../core/graph/utils";
import { useModal } from "../../core/modals";
import { useReadAtom } from "../../core/utils/atoms";
import { FunctionEditorModal } from "../../views/graphPage/modals/FunctionEditorModal";
import { CodeEditorIcon } from "../common-icons";
import { FilteredGraphSummary } from "./FilteredGraphSummary";

// eslint-disable-next-line no-new-func
const nodeFilterCustomFn = new Function(`return ( 
function nodeFilter(id, attributes, graph) {
  // Your code goes here
  return true;
})`)();

// eslint-disable-next-line no-new-func
const edgeFilterCustomFn = new Function(`return ( 
function edgeFilter(id, attributes, graph) {
  // Your code goes here
  return true;
})`)();

const SCRIPT_JS_DOC = `/**
 * Filtering function.
 *
 * @param {string} id ID of the item
 * @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the item
 * @param {FullGraph} full graph (data and rendering attributes + topology) dataset
 * @return {boolean} TRUE if the item should be kept in the graph, FALSE to filter it
 */`;

export const ScriptFilter: FC<{
  filter: ScriptFilterType;
  filterIndex: number;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode, active, filterIndex }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { replaceCurrentFilter } = useFiltersActions();
  const parentGraph = useReadAtom(parentFilteredGraphAtom);

  return (
    <div className="w-100">
      <div className="fs-5">
        {t("filters.script")} ({t(`graph.model.${filter.itemType}`)})
      </div>
      {active && <FilteredGraphSummary filterIndex={filterIndex} />}
      <div className="position-relative">
        {filter.script && (
          <>
            <div className="code-thumb mt-1">
              <Highlight className="javascript">{filter.script.toString()}</Highlight>
            </div>
            <div className="filler-fade-out position-absolute bottom-0"></div>
          </>
        )}

        {editMode && (
          <div className={cx(filter.script && "bottom-0 position-absolute w-100")}>
            <button
              className="btn btn-dark mx-auto d-block m-1"
              title={t("common.open_code_editor").toString()}
              onClick={() => {
                openModal({
                  component: FunctionEditorModal<ScriptFilterType["script"]>,
                  arguments: {
                    title: "Custom filter",
                    functionJsDoc: SCRIPT_JS_DOC,
                    defaultFunction: filter.itemType === "nodes" ? nodeFilterCustomFn : edgeFilterCustomFn,
                    value: filter.script,
                    checkFunction: (fn) => {
                      if (!fn) throw new Error("Function is not defined");
                      // Check/test the function
                      let id = null;
                      let attributs = null;
                      const graphDataset = graphDatasetAtom.get();

                      const graphGraph = dataGraphToFullGraph(graphDataset, parentGraph);

                      if (filter.itemType === "nodes" && parentGraph.order > 0) {
                        id = parentGraph.nodes()[0];
                        attributs = graphGraph.getNodeAttributes(id);
                      }
                      if (filter.itemType === "edges" && parentGraph.size > 0) {
                        id = parentGraph.edges()[0];
                        attributs = graphGraph.getEdgeAttributes(id);
                      }

                      const result = fn(id ?? "0", attributs ?? {}, graphGraph);
                      if (!isBoolean(result)) throw new Error("Function must returned a boolean");
                    },
                  },
                  beforeSubmit: ({ script }) => {
                    replaceCurrentFilter({ ...filter, script });
                  },
                });
              }}
            >
              <CodeEditorIcon className="me-1" /> {t("common.open_code_editor")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

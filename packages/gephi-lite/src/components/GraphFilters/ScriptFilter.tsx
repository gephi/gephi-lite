import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { isBoolean } from "lodash";
import { FC } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useFiltersActions } from "../../core/context/dataContexts";
import { ScriptFilterType } from "../../core/filters/types";
import { graphDatasetAtom, useFilteredGraphAt } from "../../core/graph";
import { dataGraphToFullGraph } from "../../core/graph/utils";
import { useModal } from "../../core/modals";
import { CodeEditorIcon, ExternalLinkIcon } from "../common-icons";
import { FunctionEditorModal } from "../modals/FunctionEditor";

const nodeFilterCustomFn = `function nodeFilter(id, attributes, graph) {
  //
  // Your code goes here
  //
  return true;
}`;

const edgeFilterCustomFn = `function edgeFilter(id, attributes, graph) {
  //
  // Your code goes here
  //
  return true;
}`;

function getScriptJsDoc(itemType: ItemType) {
  const name = itemType === "nodes" ? "node" : "edge";
  const itemAttrsType = itemType === "nodes" ? "GraphNode" : "GraphEdge";
  return `/**
 * Define a custom filter function.
 * The function is executed for each ${name}. 
 * If it returns true, the ${name} is included in the result set; otherwise, it is excluded.
 *
 * @param {string} id ID of the item
 * @param {${itemAttrsType}} attributes Attributes of the item
 * @param {AbstractGraph<GraphNode, GraphEdge>} graph Graphology instance (https://graphology.github.io/)
 * @return {boolean} TRUE if the item should be kept in the graph, FALSE to filter it
 */`;
}

export const ScriptFilter: FC<{
  filter: ScriptFilterType;
  filterIndex: number;
}> = ({ filter, filterIndex }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const { updateFilter } = useFiltersActions();
  const parentGraph = useFilteredGraphAt(filterIndex - 1);

  return (
    <div className="w-100">
      <div className="position-relative">
        {filter.script && (
          <>
            <div className="code-thumb mt-1">
              <Highlight className="javascript">{filter.script.toString()}</Highlight>
            </div>
            <div className="filler-fade-out position-absolute bottom-0"></div>
          </>
        )}

        <div className={cx(filter.script && "bottom-0 top-0 position-absolute w-100 h-100")}>
          <button
            className="gl-btn gl-btn-outline  gl-container-highest-bg mx-auto d-block m-3"
            title={t("common.open_code_editor").toString()}
            onClick={() => {
              openModal({
                component: FunctionEditorModal<NonNullable<ScriptFilterType["script"]>>,
                arguments: {
                  title: t("filters.script"),
                  description: (
                    <div className="m-3">
                      <p className="mb-0">{t("filters.script_description")}</p>
                      <Link
                        to="https://docs.gephi.org/lite/user-manual/custom-scripts"
                        title={t("common.help")}
                        target="_blank"
                      >
                        {t("common.see-documentation")}
                        <ExternalLinkIcon className="ms-1" />
                      </Link>
                    </div>
                  ),
                  functionJsDoc: getScriptJsDoc(filter.itemType),
                  initialFunctionCode:
                    filter.script?.toString() ??
                    (filter.itemType === "nodes" ? nodeFilterCustomFn : edgeFilterCustomFn),
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
                    if (!isBoolean(result)) throw new Error("Function must return a boolean");
                  },
                },
                beforeSubmit: ({ fn }) => {
                  updateFilter(filterIndex, { ...filter, script: fn });
                },
              });
            }}
          >
            <CodeEditorIcon className="me-1" /> {t("common.open_code_editor")}
          </button>
        </div>
      </div>
    </div>
  );
};

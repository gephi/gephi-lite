import type { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { isBoolean } from "lodash";
import { FC } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";

import { useFiltersActions } from "../../core/context/dataContexts";
import { ScriptFilterType } from "../../core/filters/types";
import { graphDatasetAtom, useFilteredGraphAt } from "../../core/graph";
import { dataGraphToFullGraph } from "../../core/graph/utils";
import { useModal } from "../../core/modals";
import { CodeEditorIcon } from "../common-icons";
import { FunctionEditorModal } from "../modals/FunctionEditor";

const nodeFilterCustomFn = `function nodeFilter(id, attributes, graph) {
  //
  // Your code goes here
  //~~~~~~~~~~~~~~~~~~~~
  //
  // Write here your own function that filter nodes.
  // For each nodes, this function will be called, and if its result is true, the node is kept.
  //
  // Example 1: keeping nodes that have a property 'age' superior than 18
  // --------------------------------------------------------------------
  // \`\`\`
  // return attributes.age > 18;
  // \`\`\`
  //
  // Example 2: filtering node that have a property 'age' below 18 and with a degree inferior to 10
  // ----------------------------------------------------------------------------------------------
  // \`\`\`
  // return attributes.age < 18 ? graph.degree(id) < 10 : true;
  // \`\`\`
  //
  // Example 3: filtering nodes on which the property 'job' is not defined
  // ---------------------------------------------------------------------
  // \`\`\`
  // return attributes.job !== undefined;
  // \`\`\`
  //
  return true;
}`;

const edgeFilterCustomFn = `function edgeFilter(id, attributes, graph) {
  //
  // Your code goes here
  //~~~~~~~~~~~~~~~~~~~~
  //
  // Write here your own function that filter edges.
  // For each edges, this function will be called, and if its result is true, the edge is kept.
  //
  // Example 1: keep edges that have a property 'cooccurence' superior than 5
  // ------------------------------------------------------------------------
  // \`\`\`
  // return attributes.cooccurence > 5;
  // \`\`\`
  //
  // Example 2: Keep edges whose target node have a degree superior than 5
  // ----------------------------------------------------------------------
  // \`\`\`
  // const targetNode = graph.target(id);
  // return graph.degree(targetNode) > 5;
  // \`\`\`
  //
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
                  title: "Custom filter",
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
                    if (!isBoolean(result)) throw new Error("Function must returned a boolean");
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

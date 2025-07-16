import { ItemData } from "@gephi/gephi-lite-sdk";
import Graph from "graphology";
import { isNil, isObject } from "lodash";

import { codeToFunction } from "../../../utils/functions";
import { graphDatasetAtom } from "../../graph";
import { dataGraphToFullGraph } from "../../graph/utils";
import { LayoutMapping, LayoutScriptFunction, SyncLayout } from "../types";

// definition of a custom layout function
const nodeCoordinatesCustomFn =
  codeToFunction<LayoutScriptFunction>(`function nodeCoordinates(id, attributes, index, graph) {
  // / Your code goes here
  return { x: Math.random() * 1000, y: Math.random() * 1000 };
}`);

export const ScriptLayout = {
  id: "script",
  type: "sync",
  description: true,
  parameters: [
    {
      id: "script",
      type: "script",
      functionJsDoc: `/**
* Function that return coordinates for the specified node.
*
* @param {string} id The ID of the node
* @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the node
* @param {number} index The index position of the node in the graph
* @param {Graph} graph The graphology instance (documentation: https://graphology.github.io/ )
* @returns {x: number, y: number} The computed coordinates of the node
*/`,
      defaultValue: nodeCoordinatesCustomFn,
      functionCheck: (fn) => {
        if (!fn) throw new Error("Function is not defined");
        // Check & test the function
        const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
        const id = fullGraph.nodes()[0];
        const attributs = fullGraph.getNodeAttributes(id);
        const result = fn(id, attributs, 0, fullGraph);
        if (!isObject(result)) throw new Error("Function must returned an object");
        if (isNil(result.x)) throw new Error("Function must returned an object with a `x` property");
        if (isNil(result.y)) throw new Error("Function must returned an object with a `y` property");
      },
    },
  ],
  run(graph: Graph, options) {
    const { script } = options?.settings || {};
    if (!script) {
      console.error("[layout] Custom function is not defined");
      return {};
    }
    // we copy the graph to avoid user to modify it
    const graphCopy = graph.copy();
    Object.freeze(graphCopy);

    const res: LayoutMapping = {};
    graph.nodes().forEach((id, index) => {
      res[id] = script(id, graph.getNodeAttributes(id), index, graphCopy);
    });
    return res;
  },
} as SyncLayout<{
  script?: (id: string, attributes: ItemData, index: number, graph: Graph) => { x: number; y: number };
}>;

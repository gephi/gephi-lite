import { isBoolean, isNumber, isString } from "lodash";

import { graphDatasetAtom } from "../../graph";
import { FullGraph } from "../../graph/types";
import { dataGraphToFullGraph } from "../../graph/utils";
import { Scalar } from "../../types";
import { Metric, MetricScriptFunction } from "../types";

// Definition of a custom metric function for edges
// eslint-disable-next-line no-new-func
const edgeMetricCustomFn = new Function(`return (
  function edgeMetric(id, attributes, index, graph) {
    // Your code goes here
    return Math.random();
  }
)`)();

export const edgeScript: Metric<{ edges: ["custom"] }> = {
  id: "edgescript",
  outputs: { edges: { custom: undefined } },
  parameters: [
    {
      id: "script",
      type: "script",
      functionJsDoc: `/**
* Function that return the metric value for the specified edge.
*
* @param {string} id The ID of the edge
* @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the node
* @param {number} index The index position of the node in the graph
* @param {Graph} graph The graphology instance (documentation: https://graphology.github.io/)
* @returns number|string The computed metric of the edge
*/`,
      functionCheck: (fn) => {
        if (!fn) throw new Error("Function is not defined");
        const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
        const id = fullGraph.edges()[0];
        const attributes = fullGraph.getEdgeAttributes(id);
        const result = fn(id, attributes, 0, fullGraph);
        if (!isNumber(result) && !isString(result) && !isBoolean(result))
          throw new Error("Function must returns a number or a string");
      },
      defaultValue: edgeMetricCustomFn,
    },
  ],
  fn(parameters: { script?: MetricScriptFunction }, graph: FullGraph) {
    const fn = parameters.script;
    if (fn) {
      // we copy the graph to avoid user to modify it
      const graphCopy = graph.copy();
      Object.freeze(graphCopy);

      const custom: Record<string, Scalar> = {};
      graph.edges().forEach((id, index) => {
        custom[id] = fn(id, graph.getEdgeAttributes(id), index, graphCopy);
      });
      return { edges: { custom } };
    }
    return {
      edges: {
        custom: {},
      },
    };
  },
};

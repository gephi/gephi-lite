import { isScalar } from "../../../utils/check";
import { graphDatasetAtom } from "../../graph";
import { FullGraph } from "../../graph/types";
import { dataGraphToFullGraph } from "../../graph/utils";
import { Scalar } from "../../types";
import { Metric, MetricScriptFunction } from "../types";

// Definition of a custom metric function for nodes
const nodeMetricCustomFn = new Function(`return (
  function nodeMetric(id, attributes, index, graph) {
    // Your code goes here
    return Math.random();
  }
)`)();

export const nodeScript: Metric<{ nodes: ["custom"] }> = {
  id: "nodescript",
  outputs: { nodes: { custom: undefined } },
  parameters: [
    {
      id: "script",
      type: "script",
      functionJsDoc: `/**
* Function that return the metric value for the specified node.
*
* @param {string} id The ID of the node
* @param {Object.<string, number | string | boolean | undefined | null>} attributes Attributes of the node
* @param {number} index The index position of the node in the graph
* @param {Graph} graph The graphology instance (documentation: https://graphology.github.io/)
* @returns number|string The computed metric of the node
*/`,
      functionCheck: (fn) => {
        if (!fn) throw new Error("Function is not defined");
        const fullGraph = dataGraphToFullGraph(graphDatasetAtom.get());
        const id = fullGraph.nodes()[0];
        const attributs = fullGraph.getNodeAttributes(id);
        const result = fn(id, attributs, 0, fullGraph);
        if (!isScalar(result))
          throw new Error("Function must returns a number, a string, a boolean, null or undefined");
      },
      defaultValue: nodeMetricCustomFn,
    },
  ],
  fn(parameters: { script?: MetricScriptFunction }, graph: FullGraph) {
    const fn = parameters.script;
    if (fn) {
      // we copy the graph to avoid user to modify it
      const graphCopy = graph.copy();
      Object.freeze(graphCopy);

      const custom: Record<string, Scalar> = {};
      graph.nodes().forEach((id, index) => {
        custom[id] = fn(id, graph.getNodeAttributes(id), index, graphCopy);
      });
      return { nodes: { custom } };
    }
    return {
      nodes: {
        custom: {},
      },
    };
  },
};

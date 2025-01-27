import { DatalessGraph, FieldModel, GraphDataset } from "../graph/types";
import { dataGraphToFullGraph, inferFieldType } from "../graph/utils";
import { ItemType } from "../types";
import { Metric, MetricReport } from "./types";

/**
 * Compute a metric and mutate the graph dataset state directly for better performance.
 *
 * @param metric metric object to apply
 * @param params metric params from metric form
 * @param attributeNames attribute⋅s where the result will be stored
 * @param filteredGraph
 * @param dataset
 * @returns
 */
export function computeMetric(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metric: Metric<any>,
  params: Record<string, unknown>,
  attributeNames: Record<string, string>,
  filteredGraph: DatalessGraph,
  dataset: GraphDataset,
): { fieldModels: FieldModel[]; report: MetricReport } {
  // get the full filtered graph
  const graph = dataGraphToFullGraph(dataset, filteredGraph);

  const scores = metric.fn(params, graph);
  const report = {}; // TODO
  const updatedFieldModels: FieldModel[] = [];
  for (const key in metric.outputs) {
    const itemType = key as ItemType;
    const itemsCount = itemType === "nodes" ? dataset.fullGraph.order : dataset.fullGraph.size;
    const dataKey = itemType === "nodes" ? "nodeData" : "edgeData";
    const data = dataset[dataKey];

    for (const score in scores[itemType]) {
      const values = scores[itemType][score];
      const attributeName = attributeNames[score];

      if (!attributeName) throw new Error("missing_attribute_name");

      // Update item values:
      for (const itemId in values) {
        data[itemId][attributeName] = values[itemId];
      }

      // Update field model:
      let qualiQuanti = metric.outputs[itemType][score];
      if (qualiQuanti === undefined) qualiQuanti = inferFieldType(Object.values(values), itemsCount);

      updatedFieldModels.push({
        itemType,
        id: attributeName,
        ...qualiQuanti,
      });
    }
  }

  return {
    report,
    fieldModels: updatedFieldModels,
  };
}

import { DatalessGraph, FieldModel, GraphDataset } from "../graph/types";
import { dataGraphToFullGraph, inferFieldType } from "../graph/utils";
import { Metric, MetricReport } from "./types";

/**
 * Compute a metric and mutate the graphdataset state directly for better performance.
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
  metric: Metric<any, any>,
  params: Record<string, unknown>,
  attributeNames: Record<string, string>,
  filteredGraph: DatalessGraph,
  dataset: GraphDataset,
): { fieldModels: FieldModel[]; report: MetricReport } {
  // get the full filtered graph
  const graph = dataGraphToFullGraph(dataset, filteredGraph);

  const scores = metric.fn(params, graph);
  const report = {}; // TODO
  const dataKey = metric.itemType === "nodes" ? "nodeData" : "edgeData";
  const data = dataset[dataKey];

  const itemsCount = metric.itemType === "nodes" ? dataset.fullGraph.order : dataset.fullGraph.size;
  const updatedFieldModels: FieldModel[] = [];
  for (const score in scores) {
    const values = scores[score];
    const attributeName = attributeNames[score];

    if (!attributeName) throw new Error("missing_attribute_name");

    // Update item values:
    for (const itemId in values) {
      data[itemId][attributeName] = values[itemId];
    }

    // Update field model:
    let qualiQuanti = metric.outputs[score];
    if (qualiQuanti === undefined) qualiQuanti = inferFieldType(Object.values(values), itemsCount);

    updatedFieldModels.push({
      id: attributeName,
      itemType: metric.itemType,
      ...qualiQuanti,
    });
  }

  return {
    report,
    fieldModels: updatedFieldModels,
  };
}

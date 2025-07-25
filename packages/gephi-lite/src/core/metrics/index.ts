import { Scalar } from "@gephi/gephi-lite-sdk";

import { inferFieldType } from "../graph/fieldModel";
import { DatalessGraph, FieldModel, GraphDataset } from "../graph/types";
import { dataGraphToFullGraph } from "../graph/utils";
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
): { fields: { model: FieldModel; values: Record<string, Scalar> }[]; report: MetricReport } {
  // get the full filtered graph
  const graph = dataGraphToFullGraph(dataset, filteredGraph);

  const scores = metric.fn(params, graph);
  const report = {}; // TODO
  const fields: { model: FieldModel; values: Record<string, Scalar> }[] = [];
  for (const key in metric.outputs) {
    const itemType = key as ItemType;
    const itemsCount = itemType === "nodes" ? dataset.fullGraph.order : dataset.fullGraph.size;

    for (const score in scores[itemType]) {
      const values = scores[itemType][score];
      const attributeName = attributeNames[score];

      if (!attributeName) throw new Error("missing_attribute_name");

      // Update field model:
      let fieldModelType = metric.outputs[itemType][score];
      if (fieldModelType === undefined)
        fieldModelType = inferFieldType(attributeName, Object.values(values), itemsCount);

      fields.push({
        values,
        model: {
          itemType,
          id: attributeName,
          ...fieldModelType,
        },
      });
    }
  }

  return {
    report,
    fields,
  };
}

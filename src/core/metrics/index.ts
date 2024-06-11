import { clone } from "lodash";

import { DatalessGraph, FieldModel, GraphDataset } from "../graph/types";
import { dataGraphToFullGraph, inferFieldType } from "../graph/utils";
import { Metric, MetricReport } from "./types";

export function computeMetric(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metric: Metric<any, any>,
  params: Record<string, unknown>,
  attributeNames: Record<string, string>,
  filteredGraph: DatalessGraph,
  dataset: GraphDataset,
): { dataset: GraphDataset; report: MetricReport } {
  // get the full filtered graph
  const graph = dataGraphToFullGraph(dataset, filteredGraph);

  const scores = metric.fn(params, graph);
  const report = {}; // TODO
  const dataKey = metric.itemType === "nodes" ? "nodeData" : "edgeData";
  const data = clone(dataset[dataKey]);

  const fieldsKey = metric.itemType === "nodes" ? "nodeFields" : "edgeFields";
  let fields = clone(dataset[fieldsKey]) as FieldModel[];

  const itemsCount = metric.itemType === "nodes" ? dataset.fullGraph.order : dataset.fullGraph.size;

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

    const newFieldModel = {
      id: attributeName,
      itemType: metric.itemType,
      ...qualiQuanti,
    };

    if (fields.find((field) => field.id === attributeName)) {
      fields = fields.map((field) => (field.id === attributeName ? newFieldModel : field));
    } else {
      fields = fields.concat(newFieldModel);
    }
  }

  return {
    report,
    dataset: {
      ...dataset,
      [dataKey]: data,
      [fieldsKey]: fields,
    },
  };
}

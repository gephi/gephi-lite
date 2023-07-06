import { clone } from "lodash";

import { Metric, MetricReport } from "./types";
import { getFilteredDataGraph, inferFieldType } from "../graph/utils";
import { FieldModel, GraphDataset, SigmaGraph } from "../graph/types";

export function computeMetric(
  metric: Metric<any, any, any>,
  params: Record<string, unknown>,
  attributeNames: Record<string, string>,
  sigmaGraph: SigmaGraph,
  dataset: GraphDataset,
): { dataset: GraphDataset; report: MetricReport } {
  const graph = getFilteredDataGraph(dataset, sigmaGraph);
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
    const newFieldModel = {
      id: attributeName,
      itemType: metric.itemType,
      ...inferFieldType(Object.values(values), itemsCount),
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

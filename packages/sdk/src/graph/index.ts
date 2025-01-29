import { MultiGraph } from "graphology";

import { gephiLiteParse, gephiLiteStringify } from "../utils";
import { GraphDataset, SerializedGraphDataset } from "./types";

export * from "./types";

export function getEmptyGraphDataset(): GraphDataset {
  return {
    nodeRenderingData: {},
    edgeRenderingData: {},
    nodeData: {},
    edgeData: {},
    metadata: { type: "mixed" },
    nodeFields: [],
    edgeFields: [],
    fullGraph: new MultiGraph(),
  };
}

export function serializeDataset(dataset: GraphDataset): SerializedGraphDataset;
export function serializeDataset(dataset: Partial<GraphDataset>): Partial<SerializedGraphDataset>;
export function serializeDataset(
  dataset: Partial<GraphDataset> | GraphDataset,
): SerializedGraphDataset | Partial<SerializedGraphDataset> {
  return dataset.fullGraph
    ? { ...dataset, fullGraph: dataset.fullGraph.export() }
    : (dataset as Partial<SerializedGraphDataset>);
}
export function deserializeDataset(dataset: SerializedGraphDataset): GraphDataset;
export function deserializeDataset(dataset: Partial<SerializedGraphDataset>): Partial<GraphDataset>;
export function deserializeDataset(
  dataset: SerializedGraphDataset | Partial<SerializedGraphDataset>,
): Partial<GraphDataset> | GraphDataset {
  if (!dataset.fullGraph) return dataset as Partial<GraphDataset>;

  const fullGraph = new MultiGraph();
  fullGraph.import(dataset.fullGraph);

  return {
    ...dataset,
    fullGraph,
  };
}

export function datasetToString(dataset: GraphDataset): string {
  return gephiLiteStringify(serializeDataset(dataset));
}
export function parseDataset(rawDataset: string): GraphDataset | null {
  try {
    // TODO:
    // Validate the actual data
    return deserializeDataset(gephiLiteParse(rawDataset) as SerializedGraphDataset);
  } catch (e) {
    console.error(e);
    return null;
  }
}

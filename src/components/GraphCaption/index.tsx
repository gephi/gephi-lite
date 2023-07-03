import { FC, useMemo } from "react";
import { fromPairs, mapValues } from "lodash";

import { useAppearance, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import NodeSizeCaption from "./NodeSizeCaption";
import { DatalessGraph, ItemData } from "../../core/graph/types";

export interface GraphCaptionProps {
  minimal?: boolean;
}

const getAttributeRanges = (graph: DatalessGraph, itemData: Record<string, ItemData>, fields: string[]) => {
  return graph.nodes().reduce((acc, n) => {
    return mapValues(acc, (value, field) => {
      const fieldValue = itemData[n][field];
      if (fieldValue && (typeof fieldValue === "number" || !isNaN(+fieldValue)))
        return { min: Math.min(value.min, +fieldValue), max: Math.max(value.max, +fieldValue) };
      return value;
    });
  }, fromPairs(fields.map((f) => [f, { min: Infinity, max: -Infinity }])));
};

const GraphCaption: FC<GraphCaptionProps> = ({ minimal }) => {
  const appearance = useAppearance();
  const filteredGraph = useFilteredGraph();
  const { nodeData, edgeData } = useGraphDataset();

  // min-max values for ranking caption items
  const rankingDataRanges = useMemo(() => {
    const ranges: Record<"node" | "edge", Record<string, { min: number; max: number }>> = { node: {}, edge: {} };
    // should we iterate on nodes
    const nodeRankingFields = [appearance.nodesColor, appearance.nodesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "ranking") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is string => f !== null);

    if (nodeRankingFields.length > 0) {
      ranges.node = getAttributeRanges(filteredGraph, nodeData, nodeRankingFields);
    }
    // should we iterate on edges
    const edgeRankingFields = [appearance.edgesColor, appearance.edgesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "ranking") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is string => f !== null);

    if (edgeRankingFields.length > 0) {
      ranges.edge = getAttributeRanges(filteredGraph, edgeData, edgeRankingFields);
    }

    return ranges;
  }, [appearance, filteredGraph, nodeData, edgeData]);

  //sigma.getNodeDisplayData(id).size

  return (
    <div title="caption" className="graph-caption">
      <NodeSizeCaption
        minimal={minimal}
        nodesSize={appearance.nodesSize}
        range={
          appearance.nodesSize.field !== undefined ? rankingDataRanges.node[appearance.nodesSize.field] : undefined
        }
      />
    </div>
  );
};

export default GraphCaption;

import { FC, useMemo } from "react";
import { fromPairs, mapValues } from "lodash";

import { useAppearance, useFilteredGraph, useGraphDataset } from "../../core/context/dataContexts";
import NodesSizeCaption from "./NodeSizeCaption";
import { DatalessGraph, ItemData } from "../../core/graph/types";
import { NodesColorCaption } from "./NodeColorCaption";

export interface GraphCaptionProps {
  minimal?: boolean;
}

export interface RangeExtends {
  min: number;
  max: number;
  missing?: boolean;
}
export type PartitionExtends = { occurrences: Record<string, number>; missing?: boolean };

const getAttributeRanges = (
  itemIds: string[],
  itemData: Record<string, ItemData>,
  rangesFields: string[],
  partitionsFields: string[],
) => {
  return itemIds.reduce((acc, n) => {
    return mapValues(acc, (value, field) => {
      const fieldValue = itemData[n][field];
      if (rangesFields.includes(field)) {
        // ranges
        if (fieldValue && (typeof fieldValue === "number" || !isNaN(+fieldValue)))
          return { min: Math.min(value.min, +fieldValue), max: Math.max(value.max, +fieldValue) };
        else return { ...value, missing: true };
      } else {
        // partitions
        if (fieldValue !== null && fieldValue !== undefined)
          return {
            ...value,
            occurrences: {
              ...value.occurrences,
              ["" + fieldValue]: (value.occurrences ? value.occurrences["" + fieldValue] || 0 : 0) + 1,
            },
          };
        else return { ...value, missing: true };
      }
    });
  }, fromPairs([...rangesFields.map((f) => [f, { min: Infinity, max: -Infinity }]), ...partitionsFields.map((f) => [f, {}])]));
};

const GraphCaption: FC<GraphCaptionProps> = ({ minimal }) => {
  const appearance = useAppearance();
  const filteredGraph = useFilteredGraph();
  const { nodeData, edgeData } = useGraphDataset();

  // min-max values for ranking caption items
  const vizAttributesExtends = useMemo(() => {
    const attributesExtends: Record<"node" | "edge", Record<string, RangeExtends | PartitionExtends>> = {
      node: {},
      edge: {},
    };
    // should we iterate on nodes
    const nodeRankingFields = [appearance.nodesColor, appearance.nodesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "ranking") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is string => f !== null);
    const nodePartitionFields = [appearance.nodesColor, appearance.nodesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "partition") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is string => f !== null);

    if (nodeRankingFields.length > 0 || nodePartitionFields.length > 0) {
      attributesExtends.node = getAttributeRanges(
        filteredGraph.nodes(),
        nodeData,
        nodeRankingFields,
        nodePartitionFields,
      );
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
    const edgePartitionFields = [appearance.edgesColor, appearance.edgesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "partition") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is string => f !== null);

    if (edgeRankingFields.length > 0 || edgePartitionFields.length > 0) {
      attributesExtends.edge = getAttributeRanges(
        filteredGraph.edges(),
        edgeData,
        edgeRankingFields,
        edgePartitionFields,
      );
    }

    return attributesExtends;
  }, [appearance, filteredGraph, nodeData, edgeData]);

  //sigma.getNodeDisplayData(id).size
  const nodeSizeExtends = appearance.nodesSize.field
    ? vizAttributesExtends.node[appearance.nodesSize.field]
    : undefined;

  return (
    <div title="caption" className="graph-caption">
      {appearance.nodesColor.field !== undefined && vizAttributesExtends.node[appearance.nodesColor.field] && (
        <NodesColorCaption
          minimal={minimal}
          nodesColor={appearance.nodesColor}
          extend={vizAttributesExtends.node[appearance.nodesColor.field]}
        />
      )}
      <NodesSizeCaption
        minimal={minimal}
        nodesSize={appearance.nodesSize}
        extend={nodeSizeExtends && "min" in nodeSizeExtends ? nodeSizeExtends : undefined}
      />
    </div>
  );
};

export default GraphCaption;

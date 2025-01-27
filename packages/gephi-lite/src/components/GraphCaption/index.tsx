import cx from "classnames";
import { fromPairs, mapValues } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiFillQuestionCircle } from "react-icons/ai";
import { BiCollapseAlt } from "react-icons/bi";

import { useAppearance, useFilteredGraph, useGraphDataset, useLayoutState } from "../../core/context/dataContexts";
import { ItemData } from "../../core/graph/types";
import { ItemsColorCaption } from "./ItemColorCaption";
import ItemSizeCaption from "./ItemSizeCaption";
import { LayoutQualityCaption } from "./LayoutQualityCaption";

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
  rankingFields: string[],
  partitionFields: string[],
) => {
  return itemIds.reduce(
    (acc, n) => {
      // rankings
      const rankings = mapValues(acc.ranking, (value, key) => {
        const fieldValue = itemData[n][key];
        if (fieldValue && (typeof fieldValue === "number" || !isNaN(+fieldValue)))
          return { ...value, min: Math.min(value.min, +fieldValue), max: Math.max(value.max, +fieldValue) };
        else return { ...value, missing: true };
      });
      // partitions
      const partitions = mapValues(acc.partition, (value, key) => {
        const fieldValue = itemData[n][key];
        if (fieldValue !== null && fieldValue !== undefined)
          return {
            ...value,
            occurrences: {
              ...value.occurrences,
              ["" + fieldValue]: (value.occurrences ? value.occurrences["" + fieldValue] || 0 : 0) + 1,
            },
          };
        else return { ...value, missing: true };
      });

      return { ranking: { ...acc.ranking, ...rankings }, partition: { ...acc.partition, ...partitions } };
    },
    {
      ranking: fromPairs(rankingFields.map((f) => [f, { min: Infinity, max: -Infinity } as RangeExtends])),
      partition: fromPairs(partitionFields.map((f) => [f, {} as PartitionExtends])),
    },
  );
};

const GraphCaption: FC<GraphCaptionProps> = ({ minimal }) => {
  const appearance = useAppearance();
  const filteredGraph = useFilteredGraph();
  const { nodeData, edgeData } = useGraphDataset();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { quality } = useLayoutState();
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    const enable =
      ["ranking", "partition"].includes(appearance.nodesColor.type) ||
      ["ranking", "partition", "source", "target"].includes(appearance.edgesColor.type) ||
      appearance.edgesSize.type === "ranking" ||
      appearance.nodesSize.type === "ranking" ||
      quality.enabled;

    setEnabled(enable);
  }, [appearance, quality.enabled]);

  // min-max values for ranking caption items
  const vizAttributesExtends = useMemo(() => {
    const attributesExtends: Record<
      "node" | "edge",
      { ranking: Record<string, RangeExtends>; partition: Record<string, PartitionExtends> }
    > = {
      node: { ranking: {}, partition: {} },
      edge: { ranking: {}, partition: {} },
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
    ? vizAttributesExtends.node["ranking"][appearance.nodesSize.field]
    : undefined;
  const edgeSizeExtends = appearance.edgesSize.field
    ? vizAttributesExtends.edge["ranking"][appearance.edgesSize.field]
    : undefined;

  return (
    <div className={cx("graph-caption", collapsed ? "collapsed" : "border")}>
      <div className="d-flex flex-column justify-content-end align-items-start align-self-end">
        <div title={enabled ? undefined : t("graph.caption.disabled").toString()}>
          <button
            title={`${t(collapsed ? "common.expand" : "common.collapse")} `}
            className="btn btn-ico btn-dark btn-sm"
            disabled={!enabled}
            onClick={() => {
              setCollapsed(!collapsed);
            }}
          >
            {collapsed || !enabled ? <AiFillQuestionCircle size="1rem" /> : <BiCollapseAlt size="1rem" />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className={cx("caption-items", !enabled && "d-none")}>
            {appearance.nodesColor.field !== undefined && (
              <ItemsColorCaption
                itemType="node"
                minimal={minimal}
                itemsColor={appearance.nodesColor}
                itemsRefinementColor={appearance.nodesRefinementColor}
                extend={vizAttributesExtends.node[appearance.nodesColor.type][appearance.nodesColor.field]}
              />
            )}
            <ItemSizeCaption
              minimal={minimal}
              itemType="node"
              itemsSize={appearance.nodesSize}
              extend={nodeSizeExtends && "min" in nodeSizeExtends ? nodeSizeExtends : undefined}
            />
            {(appearance.edgesColor.field !== undefined ||
              ["source", "target"].includes(appearance.edgesColor.type)) && (
              <ItemsColorCaption
                itemType="edge"
                minimal={minimal}
                itemsColor={appearance.edgesColor}
                itemsRefinementColor={appearance.edgesRefinementColor}
                extend={
                  appearance.edgesColor.field
                    ? vizAttributesExtends.edge[appearance.edgesColor.type][appearance.edgesColor.field]
                    : undefined
                }
              />
            )}
            <ItemSizeCaption
              minimal={minimal}
              itemType="edge"
              itemsSize={appearance.edgesSize}
              extend={edgeSizeExtends && "min" in edgeSizeExtends ? edgeSizeExtends : undefined}
            />
            <LayoutQualityCaption />
          </div>
        </>
      )}
    </div>
  );
};

export default GraphCaption;

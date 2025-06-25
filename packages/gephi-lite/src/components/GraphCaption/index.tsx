import { FieldModel, ItemType, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, mapValues } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiFillQuestionCircle } from "react-icons/ai";
import { BiCollapseAlt } from "react-icons/bi";

import {
  useAppearance,
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useLayoutState,
} from "../../core/context/dataContexts";
import { mergeStaticDynamicData, staticDynamicAttributeKey } from "../../core/graph/dynamicAttributes";
import { ItemsColorCaption } from "./ItemColorCaption";
import ItemSizeCaption from "./ItemSizeCaption";
import { LayoutQualityCaption } from "./LayoutQualityCaption";

export interface GraphCaptionProps {
  minimal?: boolean;
}

export interface RangeExtends {
  field: FieldModel<ItemType, boolean>;
  min: number;
  max: number;
  missing?: boolean;
}
export type PartitionExtends = {
  field: FieldModel<ItemType, boolean>;
  occurrences: Record<string, number>;
  missing?: boolean;
};

const getAttributeRanges = (
  itemIds: string[],
  dynamicItemData: Record<string, StaticDynamicItemData>,
  rankingFields: FieldModel<ItemType, boolean>[],
  partitionFields: FieldModel<ItemType, boolean>[],
) => {
  return itemIds.reduce(
    (acc, id) => {
      const getFieldValue = (field: FieldModel<ItemType, boolean>) =>
        field.dynamic ? dynamicItemData[id].dynamic[field.id] : dynamicItemData[id].static[field.id];
      // rankings
      const rankings = mapValues(acc.ranking, (rangeExtend) => {
        const fieldValue = getFieldValue(rangeExtend.field);
        if (fieldValue && (typeof fieldValue === "number" || !isNaN(+fieldValue)))
          return {
            ...rangeExtend,
            min: Math.min(rangeExtend.min, +fieldValue),
            max: Math.max(rangeExtend.max, +fieldValue),
          };
        else return { ...rangeExtend, missing: true };
      });
      // partitions
      const partitions = mapValues(acc.partition, (partition) => {
        const fieldValue = getFieldValue(partition.field);
        if (fieldValue !== null && fieldValue !== undefined)
          return {
            ...partition,
            occurrences: {
              ...partition.occurrences,
              ["" + fieldValue]: (partition.occurrences ? partition.occurrences["" + fieldValue] || 0 : 0) + 1,
            },
          };
        else return { ...partition, missing: true };
      });

      return { ranking: { ...acc.ranking, ...rankings }, partition: { ...acc.partition, ...partitions } };
    },
    {
      ranking: fromPairs(
        rankingFields.map((f) => [
          // TODO this key could theoritically collide with existing but chances are odd
          staticDynamicAttributeKey(f),
          { field: f, min: Infinity, max: -Infinity } as RangeExtends,
        ]),
      ),
      partition: fromPairs(
        partitionFields.map((f) => [staticDynamicAttributeKey(f), { field: f } as PartitionExtends]),
      ),
    },
  );
};

const GraphCaption: FC<GraphCaptionProps> = ({ minimal }) => {
  const appearance = useAppearance();
  const filteredGraph = useFilteredGraph();
  const { nodeData, edgeData } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData } = useDynamicItemData();
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
      .filter((f): f is FieldModel => f !== null);
    const nodePartitionFields = [appearance.nodesColor, appearance.nodesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "partition") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is FieldModel => f !== null);

    if (nodeRankingFields.length > 0 || nodePartitionFields.length > 0) {
      attributesExtends.node = getAttributeRanges(
        filteredGraph.nodes(),
        mergeStaticDynamicData(nodeData, dynamicNodeData),
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
      .filter((f): f is FieldModel => f !== null);
    const edgePartitionFields = [appearance.edgesColor, appearance.edgesSize]
      .map((appearanceSpec) => {
        if (appearanceSpec.type === "partition") {
          return appearanceSpec.field;
        }
        return null;
      })
      .filter((f): f is FieldModel => f !== null);

    if (edgeRankingFields.length > 0 || edgePartitionFields.length > 0) {
      attributesExtends.edge = getAttributeRanges(
        filteredGraph.edges(),
        mergeStaticDynamicData(edgeData, dynamicEdgeData),
        edgeRankingFields,
        edgePartitionFields,
      );
    }

    return attributesExtends;
  }, [appearance, filteredGraph, nodeData, dynamicNodeData, edgeData, dynamicEdgeData]);

  const nodeSizeExtends = appearance.nodesSize.field
    ? vizAttributesExtends.node["ranking"][staticDynamicAttributeKey(appearance.nodesSize.field)]
    : undefined;
  const edgeSizeExtends = appearance.edgesSize.field
    ? vizAttributesExtends.edge["ranking"][staticDynamicAttributeKey(appearance.edgesSize.field)]
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
                itemType="nodes"
                minimal={minimal}
                itemsColor={appearance.nodesColor}
                itemsShadingColor={appearance.nodesShadingColor}
                extend={
                  vizAttributesExtends.node[appearance.nodesColor.type][
                    staticDynamicAttributeKey(appearance.nodesColor.field)
                  ]
                }
              />
            )}
            <ItemSizeCaption
              minimal={minimal}
              itemType="nodes"
              itemsSize={appearance.nodesSize}
              extend={nodeSizeExtends && "min" in nodeSizeExtends ? nodeSizeExtends : undefined}
            />
            {(appearance.edgesColor.field !== undefined ||
              ["source", "target"].includes(appearance.edgesColor.type)) && (
              <ItemsColorCaption
                itemType="edges"
                minimal={minimal}
                itemsColor={appearance.edgesColor}
                itemsShadingColor={appearance.edgesShadingColor}
                extend={
                  appearance.edgesColor.field
                    ? vizAttributesExtends.edge[appearance.edgesColor.type][
                        staticDynamicAttributeKey(appearance.edgesColor.field)
                      ]
                    : undefined
                }
              />
            )}
            <ItemSizeCaption
              minimal={minimal}
              itemType="edges"
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

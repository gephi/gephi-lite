import { FieldModel, ItemType, StaticDynamicItemData } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { fromPairs, mapValues } from "lodash";
import { DateTime } from "luxon";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useDynamicItemData,
  useFilteredGraph,
  useGraphDataset,
  useLayoutState,
} from "../../core/context/dataContexts";
import { mergeStaticDynamicData, staticDynamicAttributeKey } from "../../core/graph/dynamicAttributes";
import {
  getFieldValue,
  getFieldValueForQuantification,
  getFieldValueFromQuantification,
} from "../../core/graph/fieldModel";
import { useMobile } from "../../hooks/useMobile";
import { shortenNumber } from "../GraphFilters/utils";
import { CaptionClose, CaptionOpen } from "../common-icons";
import { AttributeRenderers } from "../data/Attribute";
import { ItemsColorCaption } from "./ItemColorCaption";
import ItemSizeCaption from "./ItemSizeCaption";
import { LayoutQualityCaption } from "./LayoutQualityCaption";

export interface GraphCaptionProps {
  minimal?: boolean;
}

export interface RangeExtends {
  field: FieldModel<ItemType, boolean>;
  min: number;
  minValue: StaticDynamicItemData;
  max: number;
  maxItemData: StaticDynamicItemData;
  getLabel: (valueAsNumber: number, extendSize?: number) => string;
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
      // rankings
      const rankings = mapValues(acc.ranking, (rangeExtend) => {
        const valueAsNumber = getFieldValueForQuantification(dynamicItemData[id], rangeExtend.field);

        if (valueAsNumber) {
          const isMin = valueAsNumber < rangeExtend.min;
          const isMax = valueAsNumber > rangeExtend.max;
          return {
            ...rangeExtend,
            min: isMin ? valueAsNumber : rangeExtend.min,
            minItemData: isMin ? dynamicItemData[id] : rangeExtend.minValue,
            max: isMax ? valueAsNumber : rangeExtend.max,
            maxItemData: isMax ? dynamicItemData[id] : rangeExtend.maxItemData,
          };
        } else return { ...rangeExtend, missing: true };
      });
      // partitions
      const partitions = mapValues(acc.partition, (partition) => {
        const fieldValue = getFieldValue(dynamicItemData[id], partition.field);
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
          {
            field: f,
            min: Infinity,
            minValue: { static: { [f.id]: Infinity }, dynamic: {} },
            max: -Infinity,
            maxItemData: { static: { [f.id]: -Infinity }, dynamic: {} },
            getLabel: (valueAsNumber: number, extendSize?: number) => {
              const value = getFieldValueFromQuantification(valueAsNumber, f);
              switch (f.type) {
                case "number":
                  // we don't use AttributeRenderers to prefer a shorten version. Should we centralize?
                  return shortenNumber(valueAsNumber, extendSize);
                case "date":
                  return value instanceof DateTime ? AttributeRenderers.date({ value, format: f.format }) : "?";
                default:
                  return "?";
              }
            },
          } as RangeExtends,
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
  const isMobile = useMobile();
  const [collapsed, setCollapsed] = useState<boolean>(isMobile);
  const { quality } = useLayoutState();
  const enabled = useMemo(
    () =>
      ["ranking", "partition"].includes(appearance.nodesColor.type) ||
      ["ranking", "partition", "source", "target"].includes(appearance.edgesColor.type) ||
      (appearance.edgesSize.type === "ranking" && typeof appearance.edgesSize.minSize === "number") ||
      (appearance.nodesSize.type === "ranking" && typeof appearance.nodesSize.minSize === "number") ||
      quality.enabled,
    [appearance, quality.enabled],
  );

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
    <div className={cx("graph-caption", collapsed || !enabled ? "collapsed" : "border")}>
      <div className="d-flex flex-column justify-content-end align-items-start align-self-end">
        <div title={enabled ? undefined : t("graph.caption.disabled")}>
          <button
            title={`${t(collapsed ? "common.expand" : "common.collapse")} `}
            className="gl-btn gl-btn-icon gl-btn-fill"
            disabled={!enabled}
            onClick={() => {
              setCollapsed(!collapsed);
            }}
          >
            {collapsed || !enabled ? <CaptionOpen /> : <CaptionClose />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className={cx("caption-items", !enabled && "d-none")}>
            {appearance.nodesColor.field !== undefined && appearance.nodesColor.type !== "field" && (
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
            {(appearance.edgesColor.field !== undefined || ["source", "target"].includes(appearance.edgesColor.type)) &&
              appearance.edgesColor.type !== "field" && (
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

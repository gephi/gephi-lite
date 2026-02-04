import {
  DEFAULT_COLOR_SCALE_POINTS,
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  FieldModel,
  ItemType,
  PartitionColor,
  RankingColor,
} from "@gephi/gephi-lite-sdk";
import { useCallback } from "react";

import { getPalette } from "../../components/GraphAppearance/color/utils";
import { usePreferences } from "../context/dataContexts";
import { isSameField } from "./utils";

export function useColorPalette() {
  const { colors } = usePreferences();

  const getColorPartition = useCallback(
    (field: FieldModel<ItemType, boolean>, values: string[]): PartitionColor => {
      const baseValue = field.itemType === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
      const previousSpec = colors.partition?.find((p) => isSameField(p.field, field));
      if (previousSpec && values.every((v) => previousSpec.colorPalette[v] !== undefined)) return previousSpec;
      else {
        //TODO when previousSpec exist but with not all values augment it rather than replace it
        // create a new partition
        const newPartition: PartitionColor = {
          type: "partition",
          field,
          colorPalette: getPalette(values),
          missingColor: baseValue,
        };
        return newPartition;
      }
    },
    [colors.partition],
  );

  const getColorRanking = useCallback(
    (field: FieldModel<ItemType, boolean>): RankingColor => {
      const baseValue = field.itemType === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
      const previousSpec = colors.ranking?.find((p) => isSameField(p.field, field));
      if (previousSpec) return previousSpec;
      else {
        // create a new ranking
        const newPartition: RankingColor = {
          type: "ranking",
          field,
          colorScalePoints: DEFAULT_COLOR_SCALE_POINTS,
          missingColor: baseValue,
        };
        return newPartition;
      }
    },
    [colors.ranking],
  );

  return { getColorPartition, getColorRanking };
}

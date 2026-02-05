import {
  DEFAULT_COLOR_SCALE_POINTS,
  FieldModel,
  ItemType,
  MISSING_PALETTE_COLOR,
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
      const baseValue = MISSING_PALETTE_COLOR;
      const previousSpec = colors.partition?.find((p) => isSameField(p.field, field));
      if (previousSpec) {
        // make sure all existing values are listed in the palette, if not add them as null
        values
          .filter((v) => previousSpec.colorPalette[v] === undefined)
          .forEach((v) => (previousSpec.colorPalette[v] = null));
        return previousSpec;
      } else {
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
      const baseValue = MISSING_PALETTE_COLOR;
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

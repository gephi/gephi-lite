import { MISSING_PALETTE_COLOR } from "@gephi/gephi-lite-sdk";
import { keys, partition, sortBy, sum } from "lodash";

import { PartitionExtends } from "./types";

export type PartitionCaptionRow = { label: string; color: string; count?: number; isOther?: boolean };

/**
 * Lists colored values by decreasing occurrences, then N/A, then all values
 * without a color grouped in a single "other values" row.
 */
export function getPartitionCaptionRows(
  colorPalette: Record<string, string | null>,
  missingColor: string,
  { occurrences, missing }: PartitionExtends,
  otherLabel: string,
): PartitionCaptionRow[] {
  const values = sortBy(
    keys(occurrences).filter((v) => occurrences[v]),
    (v) => -occurrences[v],
  );
  const [colored, others] = partition(values, (v) => !!colorPalette[v]);

  return [
    ...colored.map((v) => ({ label: v, color: colorPalette[v] as string, count: occurrences[v] })),
    ...(missing ? [{ label: "N/A", color: missingColor }] : []),
    ...(others.length
      ? [
          {
            label: otherLabel,
            color: MISSING_PALETTE_COLOR,
            count: sum(others.map((v) => occurrences[v])),
            isOther: true,
          },
        ]
      : []),
  ];
}

import { Parameter } from "../forms/types";
import { FieldModel, FullGraph } from "../graph/types";
import { ItemType, Scalar } from "../types";

export interface Metric<Items extends ItemType, OutputKeys extends [string, ...string[]]> {
  id: string;
  outputs: Record<OutputKeys[number], Pick<FieldModel, "qualitative" | "quantitative"> | undefined>;
  itemType: Items;
  parameters: Parameter[];
  description?: boolean;
  fn: (parameters: Record<string, unknown>, graph: FullGraph) => Record<OutputKeys[number], Record<string, Scalar>>;
}

export interface MetricReport {
  // TODO
}

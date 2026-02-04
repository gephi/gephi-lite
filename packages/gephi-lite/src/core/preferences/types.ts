import { PartitionColor, RankingColor } from "@gephi/gephi-lite-sdk";

export interface Preferences {
  // for each layout, we save the parameters
  layoutsParameters: { [layout: string]: Record<string, unknown> };
  // for each metrics, we save the parameters
  metrics: {
    [metric: string]: {
      parameters: Record<string, unknown>;
      attributeNames: Record<string, string>;
    };
  };
  // for color, we save last used partition/ranking specs
  colors: {
    partition: PartitionColor[];
    ranking: RankingColor[];
  };
  // current locale
  locale: string;
  // theme
  theme: "light" | "dark" | "auto";
}

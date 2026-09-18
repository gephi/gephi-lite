import { AppearanceState, PartitionColor, RankingColor } from "@gephi/gephi-lite-sdk";

export interface Preferences {
  // for color, we save last used partition/ranking specs
  colors: {
    partition: PartitionColor[];
    ranking: RankingColor[];
  };
  // current locale
  locale: string;
  // theme
  theme: "light" | "dark" | "auto";
  // saving map style
  mapStyle?: AppearanceState["backgroundMapStyle"];
}

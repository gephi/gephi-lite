import { RemoteFile } from "../graph/import/types";

export interface Preferences {
  recentRemoteFiles: RemoteFile[];
  // for each layout, we save the parameters
  layoutsParameters: { [layout: string]: Record<string, unknown> };
  // for each metrics, we save the parameters
  metrics: {
    [metric: string]: {
      parameters: Record<string, unknown>;
      attributeNames: Record<string, string>;
    };
  };
  // current locale
  locale: string;
  // theme
  theme: "light" | "dark" | "auto";
}

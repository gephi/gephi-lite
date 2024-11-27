import { SerializedGraph } from "graphology-types";

import { AppearanceState } from "../appearance/types";

interface BaseBroadcastMessage {
  action: string;
  payload: unknown;
}

export interface ImportGraphBroadcastMessage extends BaseBroadcastMessage {
  action: "importGraph";
  payload: {
    title?: string;
    graph: SerializedGraph;
  };
}

export interface UpdateAppearanceBroadcastMessage extends BaseBroadcastMessage {
  action: "updateAppearance";
  payload: Partial<AppearanceState>;
}

export type BroadcastMessage = ImportGraphBroadcastMessage | UpdateAppearanceBroadcastMessage;

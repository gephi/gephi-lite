import {
  AppearanceState,
  FiltersState,
  GraphDataset,
  deserializeDataset,
  serializeDataset,
} from "@gephi/gephi-lite-sdk";
import EventEmitter from "events";
import { SerializedGraph } from "graphology-types";
import { isPlainObject } from "lodash";
import { v4 as uuidV4 } from "uuid";

import {
  BaseMethod,
  EventBroadcastMessage,
  GephiLiteEvents,
  GetAppearanceMethod,
  GetFiltersMethod,
  GetGraphDatasetMethod,
  GetGraphMethod,
  GetVersionMethod,
  ImportGraphMethod,
  MergeAppearanceMethod,
  MergeGraphDatasetMethod,
  Message,
  MethodBroadcastMessage,
  PingMethod,
  ReplyMessage,
  SetAppearanceMethod,
  SetFiltersMethod,
  SetGraphDatasetMethod,
  TypedEventEmitter,
} from "./types";

/**
 * This class aims at helping to control Gephi Lite from another web
 * application.
 */
export class GephiLiteDriver extends TypedEventEmitter<GephiLiteEvents> {
  private name: string;
  private timeout: number = 2000;
  private channel: BroadcastChannel;
  private pendingReplies: Map<string, (payload: unknown) => void> = new Map();

  constructor(name: string = uuidV4()) {
    super();
    this.name = name;
    this.channel = new BroadcastChannel(name);

    this.channel.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage({ data: messageData }: MessageEvent) {
    const { pendingReplies } = this;
    if (!isPlainObject(messageData) || typeof messageData.type !== "string") return;

    const { type, payload } = messageData as Message;
    switch (type) {
      case "replyMessage": {
        const { replyTo } = messageData as ReplyMessage;
        const pending = pendingReplies.get(replyTo);
        if (pending) {
          pending(payload);
          pendingReplies.delete(replyTo);
        }
        break;
      }
      case "broadcastMessage": {
        if (isPlainObject(payload) && (payload as Record<string, unknown>).type === "event") {
          const { event, data } = (messageData as EventBroadcastMessage).payload;
          (this as EventEmitter).emit(event, data);
        }
      }
    }
  }
  private callMethod<Method extends BaseMethod<string, unknown[], unknown>>(
    method: Method["method"],
    ...args: Method["arguments"]
  ): Promise<Method["expectedReturn"]> {
    const { timeout, pendingReplies, channel } = this;
    const messageID = uuidV4();

    return new Promise((resolve, reject) => {
      pendingReplies.set(messageID, (payload: unknown) => resolve(payload as Method["expectedReturn"]));
      const message: MethodBroadcastMessage<Method> = {
        id: messageID,
        type: "broadcastMessage",
        payload: { type: "callMethod", method, args },
      };
      channel.postMessage(message);

      if (timeout > 0) {
        window.setTimeout(() => {
          const pending = pendingReplies.get(messageID);
          if (pending) {
            reject(new Error(`Call to method ${method} (message ID: ${messageID}) timed out after ${timeout}ms.`));
          }
        }, timeout);
      }
    });
  }

  /**
   * Methods shortcuts:
   * ******************
   */
  ping() {
    return this.callMethod<PingMethod>("ping");
  }
  getVersion() {
    return this.callMethod<GetVersionMethod>("getVersion");
  }
  importGraph(graph: SerializedGraph) {
    return this.callMethod<ImportGraphMethod>("importGraph", graph);
  }
  getGraph() {
    return this.callMethod<GetGraphMethod>("getGraph");
  }
  async getGraphDataset() {
    const dataset = await this.callMethod<GetGraphDatasetMethod>("getGraphDataset");
    return deserializeDataset(dataset);
  }
  setGraphDataset(dataset: GraphDataset) {
    return this.callMethod<SetGraphDatasetMethod>("setGraphDataset", serializeDataset(dataset));
  }
  mergeGraphDataset(dataset: Partial<GraphDataset>) {
    return this.callMethod<MergeGraphDatasetMethod>("mergeGraphDataset", serializeDataset(dataset));
  }
  getAppearance() {
    return this.callMethod<GetAppearanceMethod>("getAppearance");
  }
  setAppearance(appearance: AppearanceState) {
    return this.callMethod<SetAppearanceMethod>("setAppearance", appearance);
  }
  mergeAppearance(appearance: Partial<AppearanceState>) {
    return this.callMethod<MergeAppearanceMethod>("mergeAppearance", appearance);
  }
  getFilters() {
    return this.callMethod<GetFiltersMethod>("getFilters");
  }
  setFilters(filters: FiltersState) {
    return this.callMethod<SetFiltersMethod>("setFilters", filters);
  }

  /**
   * Helper/lifecycle methods:
   * *************************
   */
  openGephiLite({ baseUrl = "/gephi-lite", target = "_blank" }: { baseUrl?: string; target?: string } = {}) {
    return open(`${baseUrl}?broadcast=${this.name}`, target);
  }
  destroy(): void {
    this.channel.onmessage = null;
    this.channel.close();

    this.channel = null as unknown as BroadcastChannel;
    this.pendingReplies = new Map();
  }
}

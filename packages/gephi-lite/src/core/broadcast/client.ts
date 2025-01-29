import {
  BroadcastMessage,
  EventBroadcastMessage,
  GephiLiteEvent,
  GephiLiteEventData,
  GephiLiteEvents,
  GephiLiteMethod,
  GephiLiteMethodBroadcastMessage,
  Message,
  MethodReplyMessage,
} from "@gephi/gephi-lite-broadcast";
import { AppearanceState, SerializedGraphDataset, deserializeDataset, serializeDataset } from "@gephi/gephi-lite-sdk";
import EventEmitter from "events";
import Graph from "graphology";
import { isPlainObject } from "lodash";
import { assert } from "typia";

import { config } from "../../config";
import { appearanceAtom } from "../appearance";
import { resetStates } from "../context/dataContexts";
import { fileAtom } from "../file";
import { filtersAtom } from "../filters";
import { FiltersState } from "../filters/types";
import { graphDatasetActions, graphDatasetAtom } from "../graph";
import { dataGraphToFullGraph, initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";

/**
 * This collection lists all available methods Gephi Lite should be able to
 * reply to:
 */
const BROADCAST_METHODS: {
  [key in GephiLiteMethod["method"]]: (
    this: never,
    ...args: Extract<GephiLiteMethod, { method: key }>["arguments"]
  ) => Promise<Extract<GephiLiteMethod, { method: key }>["expectedReturn"]>;
} = {
  ping: async () => {
    return;
  },
  getVersion: async () => {
    return config.version;
  },
  importGraph: async (data) => {
    if (fileAtom.get().status.type === "loading") throw new Error("A file is already being loaded");
    fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));

    try {
      const graph = Graph.from(data);
      const { setGraphDataset } = graphDatasetActions;
      resetStates(false);
      setGraphDataset({ ...initializeGraphDataset(graph) });
      resetCamera({ forceRefresh: true });
    } catch (e) {
      fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
      throw e;
    } finally {
      fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
    }
  },
  getGraph: async () => {
    const dataset = graphDatasetAtom.get();
    const graph = dataGraphToFullGraph(dataset);
    return graph.toJSON();
  },
  getGraphDataset: async () => {
    return serializeDataset(graphDatasetAtom.get());
  },
  setGraphDataset: async (appearance: SerializedGraphDataset) => {
    graphDatasetAtom.set(deserializeDataset(appearance));
    resetCamera({ forceRefresh: true });
  },
  mergeGraphDataset: async (appearance: Partial<SerializedGraphDataset>) => {
    graphDatasetAtom.set((state) => ({ ...state, ...deserializeDataset(appearance) }));
  },

  getAppearance: async () => {
    return appearanceAtom.get();
  },
  setAppearance: async (appearance: AppearanceState) => {
    appearanceAtom.set(appearance);
  },
  mergeAppearance: async (appearance: Partial<AppearanceState>) => {
    appearanceAtom.set((state) => ({ ...state, ...appearance }));
  },

  getFilters: async () => {
    return filtersAtom.get();
  },
  setFilters: async (filters: FiltersState) => {
    filtersAtom.set(filters);
  },
};

/**
 * This class aims at helping to control Gephi Lite from another web
 * application.
 */
export class BroadcastClient extends EventEmitter {
  private channel: BroadcastChannel;

  constructor(name: string) {
    super();

    this.channel = new BroadcastChannel(name);
    this.channel.onmessage = async ({ data: messageData }) => {
      if (!isPlainObject(messageData) || !isPlainObject(messageData.payload) || typeof messageData.type !== "string")
        return;

      if ((messageData as Message).type === "broadcastMessage") {
        const { id } = messageData as BroadcastMessage;
        if (!id) return;

        const { payload } = assert<GephiLiteMethodBroadcastMessage>(messageData);
        const returnValue = await this.callMethod(payload.method, payload.args);
        const replyMessage: MethodReplyMessage<GephiLiteMethod> = {
          type: "replyMessage",
          replyTo: id,
          payload: returnValue,
        };
        this.channel.postMessage(replyMessage);
      }
    };
  }

  private callMethod<Method extends GephiLiteMethod>(
    method: Method["method"],
    args: Method["arguments"],
  ): Promise<Method["expectedReturn"]> {
    return BROADCAST_METHODS[method].apply(undefined, args as unknown[]);
  }

  broadcastEvent<Event extends keyof GephiLiteEvents>(
    ...[event, data]: GephiLiteEventData<Event> extends undefined ? [Event] : [Event, GephiLiteEventData<Event>]
  ) {
    const { channel } = this;

    const message: EventBroadcastMessage<GephiLiteEvent<Event>> = {
      type: "broadcastMessage",
      payload: { type: "event", event, data: data as GephiLiteEventData<Event> },
    };
    channel.postMessage(message);
  }

  destroy(): void {
    this.channel.onmessage = null;
    this.channel.close();

    this.channel = null as unknown as BroadcastChannel;
  }
}

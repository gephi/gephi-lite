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
import EventEmitter from "events";
import Graph from "graphology";
import { isPlainObject } from "lodash";
import { assert } from "typia";

import { config } from "../../config";
import { resetStates } from "../context/dataContexts";
import { graphDatasetActions, graphDatasetAtom } from "../graph";
import { importStateAtom } from "../graph/import";
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
    if (importStateAtom.get().type === "loading") throw new Error("A file is already being loaded");
    importStateAtom.set({ type: "loading" });

    try {
      const graph = Graph.from(data);

      const { setGraphDataset } = graphDatasetActions;
      resetStates(false);
      setGraphDataset({ ...initializeGraphDataset(graph) });
      resetCamera({ forceRefresh: true });
    } catch (e) {
      importStateAtom.set({ type: "error", message: (e as Error).message });
      throw e;
    } finally {
      importStateAtom.set({ type: "idle" });
    }
  },
  getGraph: async () => {
    const dataset = graphDatasetAtom.get();
    const graph = dataGraphToFullGraph(dataset);
    return graph.toJSON();
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

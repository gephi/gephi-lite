import { AppearanceState, FiltersState, SerializedGraphDataset } from "@gephi/gephi-lite-sdk";
import EventEmitter from "events";
import { SerializedGraph } from "graphology-types";

/**
 * Helper types:
 * *************
 * (This helper type has been kindly taken from @Yomguithereal code in sigma)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;
type EventsMapping = Record<string, Listener>;
interface ITypedEventEmitter<Events extends EventsMapping> {
  rawEmitter: EventEmitter;

  eventNames<Event extends keyof Events>(): Array<Event>;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  emit<Event extends keyof Events>(type: Event, ...args: Parameters<Events[Event]>): boolean;
  addListener<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  on<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  once<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  prependListener<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  prependOnceListener<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  removeListener<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  off<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
  removeAllListeners<Event extends keyof Events>(type?: Event): this;
  listeners<Event extends keyof Events>(type: Event): Events[Event][];
  listenerCount<Event extends keyof Events>(type: Event): number;
  rawListeners<Event extends keyof Events>(type: Event): Events[Event][];
}

export class TypedEventEmitter<Events extends EventsMapping> extends (EventEmitter as unknown as {
  new <T extends EventsMapping>(): ITypedEventEmitter<T>;
})<Events> {
  constructor() {
    super();
    this.rawEmitter = this as EventEmitter;
  }
}

/**
 * Base types:
 * ***********
 */
export type BaseMethod<Method extends string = string, Args extends unknown[] = [], Return = void> = {
  method: Method;
  arguments: Args;
  expectedReturn: Return;
};

export type BaseEvent<Event extends string = string, Data = undefined> = {
  event: Event;
  data: Data;
};

/**
 * Messages:
 * *********
 */
export interface Message {
  type: string;
  payload: unknown;
}
export interface BroadcastMessage extends Message {
  type: "broadcastMessage";
  id?: string;
}
export interface ReplyMessage extends Message {
  type: "replyMessage";
  replyTo: string;
}

export interface MethodBroadcastMessage<M extends BaseMethod<string, unknown[], unknown>> extends BroadcastMessage {
  payload: {
    type: "callMethod";
    method: M["method"];
    args: M["arguments"];
  };
}
export interface MethodReplyMessage<M extends BaseMethod<string, unknown[], unknown>> extends ReplyMessage {
  payload: M["expectedReturn"];
}

export interface EventBroadcastMessage<E extends BaseEvent<string, unknown> = BaseEvent<string, unknown>>
  extends BroadcastMessage {
  payload: {
    type: "event";
    event: E["event"];
    data: E["data"];
  };
}

/**
 * List all methods:
 * *****************
 *
 * 1. Data update/reading:
 *   - [x] getGraph(): SerializedFullGraph / importGraph(graph: FullGraph)
 *   - [x] setGraphDataset / getGraphDataset / mergeGraphDataset
 *   - [x] setGraphAppearance / getGraphAppearance / mergeGraphAppearance
 *   - [x] setFilters / getFilters
 *   - [ ] setSelection / getSelection
 *
 * 2. Other methods:
 *   - [x] ping (to check broadcast status)
 *   - [x] getVersion
 *   - [ ] zoomToNodes / resetZoom
 *   - [ ] computeMetric
 *   - [ ] computeLayout / startLayout / stopLayout
 *   - [ ] notify
 *   - [ ] exportGraph
 *   - [ ] methods to handle UI elements (right panel, left tabs, caption,
 *         fullscreen)
 *
 * 3. Events
 *   - [x] instanceCreation
 *   - [ ] graphUpdate
 *   - [ ] graphModelUpdate
 *   - [ ] graphAppearanceUpdate
 *   - [ ] filtersUpdate
 *   - [ ] selectionUpdate
 */

/**
 * Method types:
 * *************
 */
export type PingMethod = BaseMethod<"ping">;
export type GetVersionMethod = BaseMethod<"getVersion", [], string>;

export type ImportGraphMethod = BaseMethod<"importGraph", [SerializedGraph]>;
export type GetGraphMethod = BaseMethod<"getGraph", [], SerializedGraph>;
export type GetGraphDatasetMethod = BaseMethod<"getGraphDataset", [], SerializedGraphDataset>;
export type SetGraphDatasetMethod = BaseMethod<"setGraphDataset", [SerializedGraphDataset]>;
export type MergeGraphDatasetMethod = BaseMethod<"mergeGraphDataset", [Partial<SerializedGraphDataset>]>;

export type GetAppearanceMethod = BaseMethod<"getAppearance", [], AppearanceState>;
export type SetAppearanceMethod = BaseMethod<"setAppearance", [AppearanceState]>;
export type MergeAppearanceMethod = BaseMethod<"mergeAppearance", [Partial<AppearanceState>]>;

export type GetFiltersMethod = BaseMethod<"getFilters", [], FiltersState>;
export type SetFiltersMethod = BaseMethod<"setFilters", [FiltersState]>;

export type GephiLiteMethod =
  | PingMethod
  | GetVersionMethod
  | ImportGraphMethod
  | GetGraphMethod
  | GetGraphDatasetMethod
  | SetGraphDatasetMethod
  | MergeGraphDatasetMethod
  | GetAppearanceMethod
  | SetAppearanceMethod
  | MergeAppearanceMethod
  | GetFiltersMethod
  | SetFiltersMethod;

export type GephiLiteMethodBroadcastMessage =
  | MethodBroadcastMessage<PingMethod>
  | MethodBroadcastMessage<GetVersionMethod>
  | MethodBroadcastMessage<ImportGraphMethod>
  | MethodBroadcastMessage<GetGraphMethod>
  | MethodBroadcastMessage<GetGraphDatasetMethod>
  | MethodBroadcastMessage<SetGraphDatasetMethod>
  | MethodBroadcastMessage<MergeGraphDatasetMethod>
  | MethodBroadcastMessage<GetAppearanceMethod>
  | MethodBroadcastMessage<SetAppearanceMethod>
  | MethodBroadcastMessage<MergeAppearanceMethod>
  | MethodBroadcastMessage<GetFiltersMethod>
  | MethodBroadcastMessage<SetFiltersMethod>;

/**
 * Event types:
 * ************
 */
export type GephiLiteEvents = {
  newInstance(): void;
};
export type GephiLiteEventData<K extends keyof GephiLiteEvents> = ReturnType<GephiLiteEvents[K]>;
export type GephiLiteEvent<K extends keyof GephiLiteEvents> = BaseEvent<K, GephiLiteEventData<K>>;

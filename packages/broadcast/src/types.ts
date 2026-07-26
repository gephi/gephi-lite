import { AppearanceState, FiltersState, SerializedGraphDataset } from "@gephi/gephi-lite-sdk";
import EventEmitter from "events";
import { SerializedGraph } from "graphology-types";

/**
 * A vendor-neutral, JSON-serialisable description of the current selection.
 * Gephi Lite's own internal selection model only ever has one active item
 * type at a time (nodes XOR edges) - this broadcast-facing shape allows both
 * arrays so external callers never need to know that implementation detail.
 * Kept independent from any internal Gephi Lite type, same spirit as
 * SerializedGraphDataset vs. GraphDataset.
 */
export interface SerializedSelectionState {
  nodeIds: string[];
  edgeIds: string[];
}

/**
 * Helper types:
 * *************
 * (This helper type has been kindly taken from @Yomguithereal code in sigma)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;
type EventsMapping = Record<string, Listener>;
// Events are declared as `eventName(): DataType` (data type carried via the return type, see
// GephiLiteEventData below), so a listener actually receiving that data must be typed from
// the event's return type, not its (always empty) parameters.
type EventListener<F extends Listener> = ReturnType<F> extends void ? () => void : (data: ReturnType<F>) => void;
interface ITypedEventEmitter<Events extends EventsMapping> {
  rawEmitter: EventEmitter;

  eventNames<Event extends keyof Events>(): Array<Event>;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  emit<Event extends keyof Events>(type: Event, ...args: Parameters<Events[Event]>): boolean;
  addListener<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  on<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  once<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  prependListener<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  prependOnceListener<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  removeListener<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  off<Event extends keyof Events>(type: Event, listener: EventListener<Events[Event]>): this;
  removeAllListeners<Event extends keyof Events>(type?: Event): this;
  listeners<Event extends keyof Events>(type: Event): EventListener<Events[Event]>[];
  listenerCount<Event extends keyof Events>(type: Event): number;
  rawListeners<Event extends keyof Events>(type: Event): EventListener<Events[Event]>[];
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
 *   - [x] setSelection / getSelection
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
 *   - [x] selectionUpdate
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

export type GetSelectionMethod = BaseMethod<"getSelection", [], SerializedSelectionState>;
export type SetSelectionMethod = BaseMethod<"setSelection", [SerializedSelectionState]>;

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
  | SetFiltersMethod
  | GetSelectionMethod
  | SetSelectionMethod;

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
  | MethodBroadcastMessage<SetFiltersMethod>
  | MethodBroadcastMessage<GetSelectionMethod>
  | MethodBroadcastMessage<SetSelectionMethod>;

/**
 * Event types:
 * ************
 */
export type GephiLiteEvents = {
  newInstance(): void;
  selectionUpdate(): SerializedSelectionState;
};
export type GephiLiteEventData<K extends keyof GephiLiteEvents> = ReturnType<GephiLiteEvents[K]>;
export type GephiLiteEvent<K extends keyof GephiLiteEvents> = BaseEvent<K, GephiLiteEventData<K>>;

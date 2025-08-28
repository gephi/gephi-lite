import EventEmitter from "events";
import { createContext, useContext } from "react";

export const EVENTS = {
  // Lifecycle:
  sigmaMounted: "sigmaMounted",
  graphImported: "graphImported",
  // Custom Gephi Lite features:
  nodesDragged: "nodesDragged",
  focusNodes: "focusNodes",
  nodeCreated: "nodeCreated",
  edgeCreated: "edgeCreated",
  searchResultsSelected: "searchResultsSelected",
} as const;

/**
 * Events context
 */
export const emitter = new EventEmitter();

export const EventsContext = createContext<{ emitter: EventEmitter }>({ emitter });

export const useEventsContext = () => useContext(EventsContext);

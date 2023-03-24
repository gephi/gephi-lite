import Graph from "graphology";
import { Coordinates } from "sigma/types";

import { ItemType } from "../types";
import { ItemData } from "../graph/types";

/**
 * Type for layout parameters
 * **************************
 */
interface BaseLayoutParameter {
  id: string;
  type: string;
  description?: boolean;
  required?: boolean;
  defaultValue?: unknown;
}

export interface LayoutBooleanParameter extends BaseLayoutParameter {
  type: "boolean";
  defaultValue: boolean;
}

export interface LayoutNumberParameter extends BaseLayoutParameter {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export interface LayoutAttributeParameter extends BaseLayoutParameter {
  type: "attribute";
  itemType: ItemType;
  restriction?: "qualitative" | "quantitative";
}

type LayoutScriptFunction = (id: string, attributes: ItemData, index: number, graph: Graph) => { x: number; y: number };
export interface LayoutScriptParameter extends BaseLayoutParameter {
  type: "script";
  defaultValue: LayoutScriptFunction;
  functionJsDoc: string;
  functionCheck: (fn?: LayoutScriptFunction) => void;
}

export type LayoutParameter =
  | LayoutScriptParameter
  | LayoutBooleanParameter
  | LayoutNumberParameter
  | LayoutAttributeParameter;

/**
 * Layout types
 * ************
 */
export interface BaseLayout {
  id: string;
  type: string;
  description?: boolean;
  parameters: Array<LayoutParameter>;
}

export type LayoutMapping = { [node: string]: Coordinates };

export interface SyncLayout<P = {}> {
  id: string;
  type: "sync";
  description?: boolean;
  parameters: Array<LayoutParameter>;
  run: (graph: Graph, options?: { settings: P }) => LayoutMapping;
}

export interface WorkerSupervisorInterface {
  start: () => void;
  stop: () => void;
  kill: () => void;
  isRunning: () => boolean;
}
export interface WorkerSupervisorConstructor<P = unknown> {
  new (graph: Graph, options?: P): WorkerSupervisorInterface;
}

export interface WorkerLayout<P = {}> {
  id: string;
  type: "worker";
  description?: boolean;
  parameters: Array<LayoutParameter>;
  supervisor: WorkerSupervisorConstructor;
}

export type Layout = WorkerLayout | SyncLayout;

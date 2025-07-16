import { FieldModelType } from "@gephi/gephi-lite-sdk";
import Graph from "graphology";
import { ConnectedClosenessResult } from "graphology-metrics/layout-quality/connected-closeness";
import { Coordinates } from "sigma/types";

import { DataGraph, ItemData } from "../graph/types";
import { ItemType } from "../types";

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
  restriction?: FieldModelType[];
}

export type LayoutScriptFunction = (
  id: string,
  attributes: ItemData,
  index: number,
  graph: Graph,
) => { x: number; y: number };
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

export interface LayoutButton<P = unknown> {
  id: string;
  description?: boolean;
  getSettings: (currentSettings: P, dataGraph: DataGraph) => P;
}

/**
 * Layout types
 * ************
 */
export type LayoutMapping = { [node: string]: Coordinates };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SyncLayout<P = any> {
  id: string;
  type: "sync";
  description?: boolean;
  buttons?: Array<LayoutButton<P>>;
  parameters: Array<LayoutParameter>;
  run: (graph: DataGraph, options?: { settings: P }) => LayoutMapping;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WorkerLayout<P = any> {
  id: string;
  type: "worker";
  description?: boolean;
  buttons?: Array<LayoutButton<P>>;
  parameters: Array<LayoutParameter>;
  supervisor: WorkerSupervisorConstructor;
}

export type Layout = WorkerLayout | SyncLayout;
export interface LayoutQuality {
  showGrid: boolean;
  enabled: boolean;
  metric?: ConnectedClosenessResult;
}
export type LayoutState = { quality: LayoutQuality } & (
  | { type: "idle" }
  | { type: "running"; layoutId: string; supervisor?: WorkerSupervisorInterface }
);

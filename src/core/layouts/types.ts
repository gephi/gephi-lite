import Graph from "graphology";

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

export type LayoutParameter = LayoutBooleanParameter | LayoutNumberParameter;

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

type LayoutMapping = { [node: string]: { [dimension: string]: number } };

export interface SyncLayout<P = {}> {
  id: string;
  type: "sync";
  description?: boolean;
  parameters: Array<LayoutParameter>;
  run: (graph: Graph, options?: P) => LayoutMapping;
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

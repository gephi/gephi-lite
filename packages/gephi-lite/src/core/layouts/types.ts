import { FieldModelType } from "@gephi/gephi-lite-sdk";
import Graph from "graphology";
import { ConnectedClosenessResult } from "graphology-metrics/layout-quality/connected-closeness";
import { ComponentType } from "react";
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

export interface LayoutEnumParameter extends BaseLayoutParameter {
  type: "enum";
  options: Array<{ id: string }>;
  defaultValue: string;
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
  | LayoutAttributeParameter
  | LayoutEnumParameter;

export interface LayoutButtonInstructions<P = unknown> {
  setSettings?: P;
  applyLayout?: boolean;
  before?: () => void;
  then?: () => void;
}

export interface LayoutButton<P = unknown> {
  id: string;
  description?: boolean;
  icon?: ComponentType;
  disabled?: (currentSettings: P, dataGraph: DataGraph) => boolean;
  onClick: (currentSettings: P, dataGraph: DataGraph) => LayoutButtonInstructions<P>;
}

/**
 * Layout types
 * ************
 */
export type LayoutMapping = { [node: string]: Coordinates };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface OneShotLayout<P = any> {
  id: string;
  type: "oneshot";
  description?: boolean;
  hideReset?: boolean;
  buttons?: Array<LayoutButton<P>>;
  parameters: Array<LayoutParameter>;
  inferSettings?: (dataGraph: DataGraph) => Partial<P>;
  run: (graph: DataGraph, options?: { settings: P }) => LayoutMapping | Promise<LayoutMapping>;
}

export interface ContinuousLayoutSupervisorInterface {
  start: () => void;
  stop: () => void;
  kill: () => void;
  isRunning: () => boolean;
}
export interface ContinuousLayoutSupervisorConstructor<P = unknown> {
  new (graph: Graph, options?: P): ContinuousLayoutSupervisorInterface;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ContinuousLayout<P = any> {
  id: string;
  type: "continuous";
  description?: boolean;
  hideReset?: boolean;
  buttons?: Array<LayoutButton<P>>;
  parameters: Array<LayoutParameter>;
  inferSettings?: (dataGraph: DataGraph) => Partial<P>;
  supervisor: ContinuousLayoutSupervisorConstructor;
}

export type Layout = ContinuousLayout | OneShotLayout;
export interface LayoutQuality {
  showGrid: boolean;
  enabled: boolean;
  metric?: ConnectedClosenessResult;
}
export type LayoutState = { quality: LayoutQuality } & (
  | { type: "idle" }
  | { type: "computing"; layoutId: string; aborted?: boolean }
  | {
      type: "running";
      layoutId: string;
      supervisor: ContinuousLayoutSupervisorInterface;
      getPositions: () => LayoutMapping;
    }
);

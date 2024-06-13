import { ReactNode } from "react";

import { ItemType } from "../types";

type BaseParameter = {
  id: string;
  required?: boolean;
  defaultValue?: unknown;
} & (
  | {
      label: string | ReactNode;
      description?: string | ReactNode;
    }
  | {
      labelKey: string;
      descriptionKey?: string;
    }
);

export type BooleanParameter = BaseParameter & {
  type: "boolean";
  defaultValue: boolean;
};

export type StringParameter = BaseParameter & {
  type: "string";
  defaultValue: string;
};

export type NumberParameter = BaseParameter & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
};

export type SliderParameter = BaseParameter & {
  type: "slider";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type EnumParameter = BaseParameter & {
  type: "enum";
  values: { value: string; label: string | ReactNode }[];
  defaultValue: string;
};

export type FieldParameter = BaseParameter & {
  type: "field";
  itemType: ItemType;
  restriction?: "qualitative" | "quantitative";
};

export type ScriptFunction = (...args: unknown[]) => unknown;
export type ScriptParameter<Fn extends ScriptFunction = () => void> = BaseParameter & {
  type: "script";
  defaultValue: Fn;
  functionJsDoc: string;
  functionCheck: (fn?: Fn) => void;
};

export type Parameter =
  | BooleanParameter
  | StringParameter
  | NumberParameter
  | SliderParameter
  | EnumParameter
  | FieldParameter
  | ScriptParameter;

type ParameterTypeMap = {
  boolean: boolean;
  number: number;
  slider: number;
  enum: string;
  field: string;
  string: string;
  script: ScriptFunction;
};

export type InferParameterValue<P extends Parameter> = ParameterTypeMap[P["type"]];

export type InferParametersState<T extends Parameter[]> = {
  [P in T[number]["id"]]: ParameterTypeMap[Extract<T[number], { id: P }>["type"]];
};

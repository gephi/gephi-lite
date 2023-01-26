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

export interface Layout {
  id: string;
  isWorker?: boolean;
  description?: boolean;
  parameters: Array<LayoutParameter>;
}

/**
 * State for the layout panel.
 */
export interface LayoutsState {
  /**
   * It's a map where the key is the id of a layout and value is the layout parameter.
   */
  layoutsParamaters: { [key: string]: Array<LayoutsState> };
  /**
   * Id of the selected layout
   */
  selected: string;
  /**
   * To know if the layout is running or not
   */
  isRunning: boolean;
}

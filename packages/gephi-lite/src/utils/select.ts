import { isNil } from "lodash";

export type Option = {
  value: string;
  label: string;
};

export function optionize(value: undefined): undefined;
export function optionize(value: string): Option;
export function optionize(value?: string): Option | undefined {
  return !isNil(value) ? { value, label: value } : undefined;
}

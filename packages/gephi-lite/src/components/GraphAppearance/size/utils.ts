import { isNumber as _isNumber } from "lodash";

export const isNumber = (value: string | number): boolean => {
  if (_isNumber(value) || !isNaN(+value)) return true;
  return false;
};

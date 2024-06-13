import { isNil } from "lodash";

import { InferParameterValue, InferParametersState, Parameter } from "./types";

export function getBaseParameterState<P extends Parameter[], S extends InferParametersState<P>>(parameters: P): S {
  return parameters.reduce(
    (iter, p) => ({
      ...iter,
      [p.id]: !isNil(p.defaultValue) ? p.defaultValue : undefined,
    }),
    {},
  ) as S;
}

export function getParameterValueFromState<P extends Parameter, S extends InferParametersState<[P]>>(
  state: any,
  parameter: P,
): S[P["type"]] {
  return state[parameter.id as keyof S] as S[P["type"]];
}

export function getParameterValue<P extends Parameter, S extends InferParameterValue<P>>(
  value: unknown,
  _parameter: P,
): S {
  return value as S;
}

import { isEqual } from "lodash";
import React, { ComponentType, FC, PropsWithChildren, ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { InferParametersState, Parameter } from "../../core/forms/types";
import { getParameterValueFromState } from "../../core/forms/utils";
import MessageTooltip from "../MessageTooltip";
import { ParameterInput } from "./TypedInputs";

const DefaultInputWrapper: FC<PropsWithChildren> = ({ children }) => {
  return <div className="my-1">{children}</div>;
};

export const ControlledForm = <P extends Parameter[], S extends InferParametersState<P> = InferParametersState<P>>({
  parameters,
  state: initialState,
  onChange,
  className,
  inputWrapper = DefaultInputWrapper,
  noSubmit = false,
  submitMessage,
  successMessage,
  children,
}: {
  parameters: P;
  state: S;
  onChange: (newState: S) => void;
  className?: string;
  inputWrapper?: ComponentType<PropsWithChildren>;
  noSubmit?: boolean;
  submitMessage?: string;
  successMessage?: { date: number; message: string };
  children?: ReactNode | [ReactNode] | [ReactNode, ReactNode];
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<S>(initialState);
  const disabled = useMemo(() => isEqual(initialState, state), [initialState, state]);
  const InputWrapper = inputWrapper;
  const [top, bottom] = Array.isArray(children) ? children : [children];

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    if (!disabled && noSubmit) onChange(state);
  }, [state, noSubmit, disabled]);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onChange(state);
      }}
    >
      {top}
      {parameters.map((param) => (
        <InputWrapper key={param.id}>
          <ParameterInput
            param={param}
            value={getParameterValueFromState(state, param)}
            onChange={(value) => setState({ ...state, [param.id]: value })}
          />
        </InputWrapper>
      ))}
      {bottom}
      {!noSubmit && (
        <>
          <hr className="m-0" />

          <div className="z-over-loader panel-block d-flex flex-row align-items-center">
            {successMessage && (
              <MessageTooltip
                openOnMount={2000}
                key={successMessage.date}
                message={successMessage.message}
                type="success"
                iconClassName="fs-4"
              />
            )}
            <div className="flex-grow-1" />
            <button
              type="reset"
              className="btn btn-outline-secondary ms-2"
              onClick={() => setState(initialState)}
              disabled={disabled}
            >
              {t("common.reset")}
            </button>
            <button type="submit" className="btn btn-primary ms-2" disabled={disabled}>
              {submitMessage || t("common.submit")}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

import cx from "classnames";
import { clamp, isNil } from "lodash";
import Slider from "rc-slider";
import { MarkObj } from "rc-slider/lib/Marks";
import { SliderProps } from "rc-slider/lib/Slider";
import React, { FC, InputHTMLAttributes, ReactNode, useEffect, useMemo, useState } from "react";
import Highlight from "react-highlight";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { useGraphDataset } from "../../core/context/dataContexts";
import { InferParameterValue, Parameter, ScriptFunction, ScriptParameter } from "../../core/forms/types";
import { getParameterValue } from "../../core/forms/utils";
import { FieldModel } from "../../core/graph/types";
import { useModal } from "../../core/modals";
import { ItemType } from "../../core/types";
import { FunctionEditorModal } from "../../views/graphPage/modals/FunctionEditorModal";
import MessageTooltip from "../MessageTooltip";
import { CodeEditorIcon } from "../common-icons";
import { DEFAULT_SELECT_PROPS } from "../consts";

interface BaseTypedInputProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
}

export const SLIDER_STYLE = {
  dotStyle: { borderColor: "#ccc" },
  railStyle: { backgroundColor: "#ccc" },
  activeDotStyle: { borderColor: "black" },
  trackStyle: { backgroundColor: "black" },
  handleStyle: { backgroundColor: "white", borderColor: "black" },
};

export const NumberInput: FC<
  { value: number | null; onChange: (v: number | null) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  return (
    <div className="mt-1">
      <label htmlFor={id} className="form-check-label small">
        {label}
      </label>
      <input
        {...attrs}
        type="number"
        className={cx("form-control form-control-sm", className)}
        id={id}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber)}
      />
      {description && <div className="form-text small text-muted">{description}</div>}
    </div>
  );
};

export const SliderInput: FC<
  {
    value: number | null;
    onChange: (v: number) => void;
    className?: string;
    min: number;
    max: number;
    step: number;
    marks?: Record<string | number, React.ReactNode | MarkObj>;
  } & Omit<BaseTypedInputProps, "id">
> = ({ label, description, value, onChange, min, max, marks, step, className }) => {
  const validMin = useMemo(() => Math.min(min, max), [min, max]);
  const validMax = useMemo(() => Math.max(min, max), [min, max]);
  const validValue = useMemo(() => {
    if (typeof value !== "number") return validMin;
    return clamp(value, validMin, validMax);
  }, [value, validMin, validMax]);

  return (
    <div className={cx("mt-1 px-2", className)}>
      <label className="form-check-label small">{label}</label>
      <div className="pb-3">
        <Slider
          value={validValue}
          min={validMin}
          max={validMax}
          step={step}
          marks={
            marks || {
              [validMin]: validMin,
              [validMax]: validMax,
              [validValue]: validValue,
            }
          }
          onChange={
            ((v: number) => {
              onChange(v);
            }) as SliderProps["onChange"]
          }
          // Styles:
          {...SLIDER_STYLE}
        />
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
    </div>
  );
};

export const StringInput: FC<
  { value: string | null; onChange: (v: string) => void; warning?: string } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, warning, ...attrs }) => {
  return (
    <div className="mt-1">
      <label htmlFor={id} className="form-check-label small">
        {label}
      </label>
      <div className="position-relative">
        <input
          {...attrs}
          type="string"
          className={cx("form-control form-control-sm", className)}
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {warning && (
          <MessageTooltip
            message={warning}
            type="warning"
            className="position-absolute end-0 top-0 h-100 me-2 d-flex align-items-center"
            iconClassName="fs-4"
          />
        )}
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
    </div>
  );
};

export const BooleanInput: FC<
  { value: boolean | null; onChange: (v: boolean) => void } & BaseTypedInputProps &
    Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">
> = ({ id, label, description, value, onChange, className, ...attrs }) => {
  const [isChecked, setIsChecked] = useState<boolean>(isNil(value) ? false : value);
  useEffect(() => {
    setIsChecked(isNil(value) ? false : value);
  }, [value]);

  return (
    <>
      <div className="form-check mt-1">
        <input
          {...attrs}
          type="checkbox"
          className={cx("form-check-input", className)}
          id={id}
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id} className="form-check-label small ms-1">
          {label}
        </label>
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
    </>
  );
};

export interface EnumOption {
  value: string;
  label: string | ReactNode;
}
export const EnumInput: FC<
  {
    value: string | null;
    options: EnumOption[];
    onChange: (v: string | null) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  } & BaseTypedInputProps
> = ({ id, label, description, required, disabled, value, options, onChange, className, placeholder }) => {
  const option = options.find((o) => o.value === value);

  return (
    <>
      <div className="mt-1">
        <label htmlFor={id} className="form-check-label small">
          {label}
        </label>
        <Select<EnumOption>
          {...DEFAULT_SELECT_PROPS}
          isDisabled={disabled}
          isClearable={!required}
          className={className}
          placeholder={placeholder}
          value={option || null}
          options={options}
          onChange={(o) => onChange(o?.value || null)}
        />
      </div>
      {description && <div className="form-text small text-muted">{description}</div>}
    </>
  );
};

export const FieldInput: FC<
  {
    value: string | null;
    onChange: (v: string | null) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    itemType: ItemType;
    restriction?: "qualitative" | "quantitative";
  } & BaseTypedInputProps
> = ({ itemType, restriction, ...props }) => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const fields = useMemo(
    () =>
      ((itemType === "nodes" ? nodeFields : edgeFields) as FieldModel[])
        .filter((field) => (restriction ? !!field[restriction] : true))
        .map((field) => ({
          value: field.id,
          label: field.id,
        })),
    [nodeFields, edgeFields, itemType, restriction],
  );
  return <EnumInput {...props} options={fields} />;
};

export const ScriptInput: FC<{
  id: string;
  label: string | ReactNode;
  description?: string | ReactNode;
  defaultValue: ScriptFunction;
  functionJsDoc: string;
  functionCheck: (fn?: ScriptFunction) => void;
  value?: ScriptFunction;
  onChange: (fn?: ScriptFunction) => void;
}> = ({ functionJsDoc, defaultValue, functionCheck, value, onChange }) => {
  const { t } = useTranslation();
  const { openModal } = useModal();

  return (
    <div className="position-relative">
      <>
        {value && (
          <>
            <div className="code-thumb mt-1">
              <Highlight className="javascript">{value.toString()}</Highlight>
            </div>
            <div className="filler-fade-out position-absolute bottom-0"></div>
          </>
        )}
        <div className={cx(value ? "bottom-0 position-absolute w-100" : "")}>
          <button
            type="button"
            className="btn btn-dark mx-auto d-block m-3"
            onClick={() => {
              openModal({
                component: FunctionEditorModal<ScriptParameter["defaultValue"]>,
                arguments: {
                  title: "Custom metric",
                  withSaveAndRun: true,
                  functionJsDoc: functionJsDoc,
                  defaultFunction: defaultValue,
                  value: value,
                  checkFunction: functionCheck,
                },
                beforeSubmit: ({ script }) => {
                  onChange(script);
                },
              });
            }}
            title={t("common.open_code_editor").toString()}
          >
            <CodeEditorIcon className="me-1" />
            {t("common.open_code_editor")}
          </button>
        </div>
      </>
    </div>
  );
};

export const ParameterInput = <P extends Parameter, S extends InferParameterValue<P>>({
  param,
  value,
  onChange,
  warning,
}: {
  param: Parameter;
  value: unknown;
  onChange: (newValue: unknown) => void;
  warning?: string;
}) => {
  const { t } = useTranslation();
  const label = "label" in param ? param.label : t(param.labelKey);
  const description = "label" in param ? param.description : param.descriptionKey ? t(param.descriptionKey) : undefined;

  switch (param.type) {
    case "number":
      return (
        <NumberInput
          id={param.id}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          onChange={(value) => onChange(value)}
        />
      );
    case "slider":
      return (
        <SliderInput
          min={param.min}
          max={param.max}
          step={param.step}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          onChange={(value) => onChange(value)}
        />
      );
    case "string":
      return (
        <StringInput
          id={param.id}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          onChange={(value) => onChange(value)}
          warning={warning}
        />
      );
    case "boolean":
      return (
        <BooleanInput
          id={param.id}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          onChange={(value) => onChange(value)}
        />
      );
    case "enum":
      return (
        <EnumInput
          id={param.id}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          options={param.values}
          onChange={(value) => onChange(value)}
        />
      );
    case "field":
      return (
        <FieldInput
          id={param.id}
          label={label}
          description={description}
          value={getParameterValue(value, param)}
          itemType={param.itemType}
          restriction={param.restriction}
          onChange={(value) => onChange(value)}
        />
      );
    case "script":
      return (
        <ScriptInput
          id={param.id}
          label={label}
          description={description}
          defaultValue={param.defaultValue}
          functionCheck={param.functionCheck}
          functionJsDoc={param.functionJsDoc}
          value={getParameterValue(value, param)}
          onChange={(value) => onChange(value)}
        />
      );
  }
};

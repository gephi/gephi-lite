/* eslint-disable react-hooks/rules-of-hooks */
import {
  FieldModel,
  FieldModelAbstraction,
  FieldModelType,
  FieldModelTypeSpec,
  ItemType,
  ModelValueType,
  Scalar,
} from "@gephi/gephi-lite-sdk";
import { isNil } from "lodash";
import { DateTime } from "luxon";
import React, { FC, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactLinkify from "react-linkify";
import { MultiValueProps, OptionProps, SingleValueProps, components } from "react-select";
import { GroupBase } from "react-select/dist/declarations/src/types";

import { castScalarToModelValue, serializeModelValueToScalar } from "../../core/graph/fieldModel";
import { useDataCollection } from "../../hooks/useDataCollection";
import { prettifyURL } from "../../utils/linkify";
import { DEFAULT_LINKIFY_PROPS } from "../../utils/url";
import ColorPicker, { InlineColorPicker } from "../ColorPicker";
import MessageTooltip from "../MessageTooltip";
import { FieldModelIcon, InvalidDataIcon } from "../common-icons";
import { Checkbox } from "../forms/Checkbox";
import { BaseOption, CreatableSelect, optionize } from "../forms/Select";

/**
 * Render values:
 * **************
 */
export const InvalidAttributeRenderer: FC<{ value: Scalar; expectedType: FieldModelType }> = ({
  value,
  expectedType,
}) => {
  const { t } = useTranslation("translation");
  return (
    <span className="invalid-value">
      <span>{value}</span>{" "}
      <MessageTooltip
        className="message-tooltip"
        message={t("graph.model.warnings.invalid_data", { value, type: expectedType })}
        icon={InvalidDataIcon}
      />
    </span>
  );
};
export const AttributeRenderers: {
  [K in keyof FieldModelAbstraction]: FC<
    {
      value?: FieldModelAbstraction[K]["expectedOutput"];
    } & FieldModelAbstraction[K]["options"]
  >;
} = {
  text: ({ value }) => (!isNil(value) ? <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>{value}</ReactLinkify> : null),
  url: ({ value }) =>
    !isNil(value) ? (
      <a href={value} target="_blank" rel="noreferrer" title={value}>
        {prettifyURL(value)}
      </a>
    ) : null,
  number: ({ value }) => {
    const { i18n } = useTranslation();
    return !isNil(value) ? <>{value.toLocaleString(i18n.language)}</> : null;
  },
  boolean: ({ value }) => (
    <div className="form-check h-100 ">
      <Checkbox className="form-check-input disabled" checked={value} />
    </div>
  ),
  category: ({ value }) => (!isNil(value) ? <span className="badge rounded-pill text-bg-dark">{value}</span> : null),
  keywords: ({ value }) =>
    value?.length ? (
      <span className="d-inline-flex gl-gap-1">
        {value.map((keyword, i) => (
          <span key={i} className="badge rounded-pill text-bg-dark">
            {keyword}
          </span>
        ))}
      </span>
    ) : null,
  date: ({ value, format }) => (!isNil(value) ? value.toFormat(format) : null),
  color: ({ value }) =>
    !isNil(value) ? (
      <span className="d-inline-flex align-items-center gl-gap-1">
        <span className="square border border-black border-2" style={{ background: value }} /> {value}
      </span>
    ) : null,
};
export const RenderText = AttributeRenderers.text;
export const RenderNumber = AttributeRenderers.number;
export const RenderBoolean = AttributeRenderers.boolean;
export const RenderCategory = AttributeRenderers.category;
export const RenderKeywords = AttributeRenderers.keywords;
export const RenderDate = AttributeRenderers.date;
export const RenderColor = AttributeRenderers.color;

export const RenderItemAttribute: FC<{ field: FieldModelTypeSpec; value: Scalar }> = ({ field, value }) => {
  const castValue = castScalarToModelValue(value, field);
  const AttributeRenderer = AttributeRenderers[field.type] as FC<{ value?: ModelValueType }>;

  if (!isNil(value) && isNil(castValue)) return <InvalidAttributeRenderer value={value} expectedType={field.type} />;
  return <AttributeRenderer {...field} value={castValue} />;
};

/**
 * Edit values:
 * ************
 */
const StringEditor = ({
  value,
  onChange,
  id,
  autoFocus,
  placeholder,
}: {
  value?: string;
  onChange: (value?: string) => void;
  autoFocus?: boolean;
  id?: string;
  placeholder?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && autoFocus) ref.current.focus();
  }, [autoFocus]);

  return (
    <input
      id={id}
      ref={ref}
      className="form-control"
      type="string"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
};

export const AttributeEditors: {
  [K in FieldModelType]: FC<{
    value?: FieldModelAbstraction[K]["expectedOutput"];
    onChange: (value?: FieldModelAbstraction[K]["expectedOutput"]) => void;
    field: FieldModel<ItemType, boolean, K>;
    autoFocus?: boolean;
    id?: string;
    placeholder?: string;
    inTooltip?: boolean;
  }>;
} = {
  text: StringEditor,
  url: StringEditor,
  number: ({ value, onChange, id, autoFocus, placeholder }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (ref.current && autoFocus) ref.current.focus();
    }, [autoFocus]);

    return (
      <input
        id={id}
        ref={ref}
        className="form-control"
        type="number"
        value={value ?? ""}
        step="any"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value ? +e.target.value : undefined)}
      />
    );
  },
  boolean: ({ value, onChange, id, autoFocus }) => (
    <div className="form-check h-100 ">
      <Checkbox
        className="form-check-input"
        id={id}
        autoFocus={autoFocus}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  ),
  category: ({ value, onChange, field, id, autoFocus, placeholder }) => {
    const values = useDataCollection(field);
    const options = useMemo(
      () =>
        Array.from(values)
          .sort()
          .flatMap((v) => (isNil(v) ? [] : [optionize(v)])),
      [values],
    );
    const OptionComponent = useCallback((props: OptionProps<BaseOption, false>) => {
      const Option = components.Option<BaseOption, false, GroupBase<BaseOption>>;
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Option {...props}>
            <RenderCategory value={props.data.value} />
          </Option>
        </div>
      );
    }, []);
    const SingleValueComponent = useCallback((props: SingleValueProps<BaseOption, false>) => {
      const SingleValue = components.SingleValue<BaseOption, false, GroupBase<BaseOption>>;
      return (
        <SingleValue {...props}>
          <RenderCategory value={props.data.value} />
        </SingleValue>
      );
    }, []);

    return (
      <CreatableSelect<BaseOption>
        id={id}
        autoFocus={autoFocus}
        menuPosition="absolute"
        placeholder={placeholder}
        value={!isNil(value) ? optionize(value) : undefined}
        onChange={(newValue) => onChange(newValue?.value)}
        options={options}
        isClearable
        components={{
          Option: OptionComponent,
          SingleValue: SingleValueComponent,
        }}
      />
    );
  },
  keywords: ({ value, onChange, field, id, autoFocus, placeholder }) => {
    const values = useDataCollection(field);
    const options = useMemo(
      () =>
        Array.from(values)
          .sort()
          .flatMap((v) => (isNil(v) ? [] : [optionize(v)])),
      [values],
    );
    const OptionComponent = useCallback(
      (props: OptionProps<BaseOption, true>) => {
        const Option = components.Option<BaseOption, true, GroupBase<BaseOption>>;
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Option {...props}>
              <RenderKeywords value={[props.data.value]} separator={field.separator} />
            </Option>
          </div>
        );
      },
      [field.separator],
    );
    const MultiValueContainerComponent = useCallback(
      (props: MultiValueProps<BaseOption, true>) => {
        const MultiValueContainer = components.MultiValueContainer<BaseOption, true, GroupBase<BaseOption>>;
        return (
          <MultiValueContainer {...props}>
            <RenderKeywords value={[props.data.value]} separator={field.separator} />
          </MultiValueContainer>
        );
      },
      [field.separator],
    );

    return (
      <CreatableSelect<BaseOption, true>
        isMulti
        id={id}
        autoFocus={autoFocus}
        menuPosition="absolute"
        placeholder={placeholder}
        value={value?.map(optionize)}
        onChange={(newValue) => onChange(newValue.length ? newValue.map((o) => o.value) : undefined)}
        options={options}
        isClearable
        components={{
          Option: OptionComponent,
          MultiValueContainer: MultiValueContainerComponent,
        }}
      />
    );
  },
  date: ({ value, onChange, id, autoFocus, field, placeholder }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (ref.current && autoFocus) ref.current.focus();
    }, [autoFocus]);

    // TODO: use an more advanced date time input which allow partial date input to respect requested format
    const inputType = field.format.includes("h") ? "datetime-local" : "date";
    const inputDateFormat = field.format.includes("h") ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd";
    return (
      <input
        id={id}
        ref={ref}
        className="form-control"
        type={inputType}
        value={value?.toFormat(inputDateFormat) ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const date = e.target.value ? DateTime.fromFormat(e.target.value, inputDateFormat) : undefined;
          onChange(date?.isValid ? date : undefined);
        }}
      />
    );
  },
  color: ({ value, onChange, inTooltip }) => {
    return inTooltip ? (
      <div className="custom-color-picker">
        <InlineColorPicker color={value} onChange={(v) => onChange(v)} />
      </div>
    ) : (
      <div className="d-flex">
        <ColorPicker clearable color={value} onChange={(v) => onChange(v)} />
      </div>
    );
  },
};
export const EditText = AttributeEditors.text;
export const EditNumber = AttributeEditors.number;
export const EditBoolean = AttributeEditors.boolean;
export const EditCategory = AttributeEditors.category;
export const EditKeywords = AttributeEditors.keywords;
export const EditDate = AttributeEditors.date;

export const EditItemAttribute: FC<{
  field: FieldModel<ItemType, boolean>;
  scalar: Scalar;
  onChange: (value: Scalar) => void;
  id?: string;
  autoFocus?: boolean;
  inTooltip?: boolean;
  placeholder?: string;
}> = ({ field, scalar, onChange, id, autoFocus, inTooltip, placeholder }) => {
  const EditComponent = AttributeEditors[field.type] as FC<{
    field: FieldModel<ItemType, boolean>;
    onChange: (value?: FieldModelAbstraction[FieldModelType]["expectedOutput"]) => void;
    value?: FieldModelAbstraction[FieldModelType]["expectedOutput"];
    id?: string;
    autoFocus?: boolean;
    placeholder?: string;
    inTooltip?: boolean;
  }>;

  return (
    <EditComponent
      id={id}
      field={field}
      autoFocus={autoFocus}
      inTooltip={inTooltip}
      placeholder={placeholder}
      value={castScalarToModelValue(scalar, field)}
      onChange={(value) => onChange(serializeModelValueToScalar(value, field, scalar))}
    />
  );
};

/**
 * Render Attribute label
 * **********************
 */

export const AttributeLabel: FC<{ field: FieldModel<ItemType, boolean> } & React.HTMLProps<HTMLSpanElement>> = ({
  field,
  ...spanProps
}) => {
  return (
    <span {...spanProps}>
      <FieldModelIcon className="me-1" type={field.type} />
      {field.label || field.id}
    </span>
  );
};

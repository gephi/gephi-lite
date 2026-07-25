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

import {
  castScalarToEditableValue,
  castScalarToModelValue,
  serializeModelValueToScalar,
} from "../../core/graph/fieldModel";
import { useDataCollection } from "../../hooks/useDataCollection";
import { prettifyURL } from "../../utils/linkify";
import { DEFAULT_LINKIFY_PROPS } from "../../utils/url";
import ColorPicker, { InlineColorPicker } from "../ColorPicker";
import MessageTooltip from "../MessageTooltip";
import { CancelIcon, FieldModelIcon, InvalidDataIcon } from "../common-icons";
import { Checkbox } from "../forms/Checkbox";
import { NumberInput } from "../forms/NumberInput";
import { CreatableSelect, StringOption, optionize } from "../forms/Select";

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

// Order-sensitive "first empty field" autofocus: a value is considered empty when it's the
// field's own no-value state (unset, blank, or an empty list) - 0 and false are real values, not emptiness.
export const isEmptyFieldValue = (value: unknown): boolean =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

export const getFirstEmptyValueIndex = (values: unknown[]): number => values.findIndex(isEmptyFieldValue);

/**
 * The "no value" marker to store in a react-hook-form field when the user empties it.
 *
 * It cannot be `undefined`: react-hook-form falls back to a field's defaultValue whenever its value
 * is `undefined`, so the original value would pop straight back the moment the input becomes empty -
 * making the field impossible to clear (and thus to retype). `null` means the same thing, but being
 * a *defined* value it is kept as-is, and every `castScalarToModelValue` branch reads it as empty.
 */
export const EMPTY_FIELD_VALUE = null;

/** Normalizes what an editor emits into a value react-hook-form will not silently revert. */
export const toFormFieldValue = (value: Scalar): Scalar => value ?? EMPTY_FIELD_VALUE;

/**
 * Whether a value can be stored in the given field. Emptiness is always valid (the attribute is
 * simply not set); anything else must survive the field's cast, ie. actually be a URL, a number, a
 * date... Used to validate on submit rather than while typing, so an incomplete entry never fights
 * the user mid-input.
 */
export const isValidFieldValue = (scalar: Scalar, field: FieldModelTypeSpec): boolean =>
  isEmptyFieldValue(scalar) || castScalarToModelValue(scalar, field) !== undefined;

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
  number: ({ value, onChange, id, autoFocus, placeholder }) => (
    <NumberInput id={id} value={value} onChange={onChange} autoFocus={autoFocus} placeholder={placeholder} />
  ),
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
    const OptionComponent = useCallback((props: OptionProps<StringOption, false>) => {
      const Option = components.Option<StringOption, false, GroupBase<StringOption>>;
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
    const SingleValueComponent = useCallback((props: SingleValueProps<StringOption, false>) => {
      const SingleValue = components.SingleValue<StringOption, false, GroupBase<StringOption>>;
      return (
        <SingleValue {...props}>
          <RenderCategory value={props.data.value} />
        </SingleValue>
      );
    }, []);

    return (
      <CreatableSelect<StringOption>
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
      (props: OptionProps<StringOption, true>) => {
        const Option = components.Option<StringOption, true, GroupBase<StringOption>>;
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
      (props: MultiValueProps<StringOption, true>) => {
        const MultiValueContainer = components.MultiValueContainer<StringOption, true, GroupBase<StringOption>>;
        return (
          <MultiValueContainer {...props}>
            <RenderKeywords value={[props.data.value]} separator={field.separator} />
          </MultiValueContainer>
        );
      },
      [field.separator],
    );

    return (
      <CreatableSelect<StringOption, true>
        isMulti
        id={id}
        autoFocus={autoFocus}
        menuPosition="absolute"
        placeholder={placeholder}
        value={value?.map(optionize<string>)}
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
  color: ({ value, onChange, inTooltip, autoFocus }) => {
    return inTooltip ? (
      <div className="custom-color-picker">
        <InlineColorPicker color={value} onChange={(v) => onChange(v)} />
      </div>
    ) : (
      <div className="d-flex">
        <ColorPicker clearable color={value} onChange={(v) => onChange(v)} autoFocus={autoFocus} />
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

// Field types whose editor is a plain input, with no built-in way to empty it in one gesture: the
// selects (category, keywords) and the color picker already provide their own clear control, and a
// checkbox is never "empty".
const CLEARABLE_WITH_BUTTON: FieldModelType[] = ["text", "url", "number", "date"];

export const EditItemAttribute: FC<{
  field: FieldModel<ItemType, boolean>;
  scalar: Scalar;
  onChange: (value: Scalar) => void;
  id?: string;
  autoFocus?: boolean;
  inTooltip?: boolean;
  placeholder?: string;
  /**
   * Adds a button emptying the field in one click, for the plain-input types that have no such
   * control of their own. Opt-in: it is meant for form-like editors (node/edge edition), and would
   * be ambiguous next to a cancel button of the same shape (see the data table cell editor).
   */
  clearable?: boolean;
}> = ({ field, scalar, onChange, id, autoFocus, inTooltip, placeholder, clearable }) => {
  const { t } = useTranslation();
  const editorWrapper = useRef<HTMLDivElement>(null);
  const EditComponent = AttributeEditors[field.type] as FC<{
    field: FieldModel<ItemType, boolean>;
    onChange: (value?: FieldModelAbstraction[FieldModelType]["expectedOutput"]) => void;
    value?: FieldModelAbstraction[FieldModelType]["expectedOutput"];
    id?: string;
    autoFocus?: boolean;
    placeholder?: string;
    inTooltip?: boolean;
  }>;

  const editor = (
    <EditComponent
      id={id}
      field={field}
      autoFocus={autoFocus}
      inTooltip={inTooltip}
      placeholder={placeholder}
      value={castScalarToEditableValue(scalar, field)}
      onChange={(value) => onChange(toFormFieldValue(serializeModelValueToScalar(value, field, scalar)))}
    />
  );

  if (!clearable || !CLEARABLE_WITH_BUTTON.includes(field.type)) return editor;

  return (
    <div className="d-flex align-items-center gl-gap-1">
      {/* min-width:0 lets the editor shrink inside the flex row instead of overflowing it. */}
      <div ref={editorWrapper} className="flex-grow-1" style={{ minWidth: 0 }}>
        {editor}
      </div>
      <button
        type="button"
        className="gl-btn gl-btn-icon gl-btn-outline flex-shrink-0"
        title={t("common.clear")}
        aria-label={t("common.clear")}
        disabled={isEmptyFieldValue(scalar)}
        // Emptying a field is a step in retyping it, so the caret must stay where the user is going
        // to type: don't take the focus on press, and hand it back to the field afterwards (it may
        // not have had it, and the button gets disabled right after clearing anyway).
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onChange(EMPTY_FIELD_VALUE);
          editorWrapper.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")?.focus();
        }}
      >
        <CancelIcon />
      </button>
    </div>
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

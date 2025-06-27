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
import { FC, createElement, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactLinkify from "react-linkify";
import { MultiValueProps, OptionProps, SingleValueProps, components } from "react-select";
import { GroupBase } from "react-select/dist/declarations/src/types";

import { castScalarToModelValue, serializeModelValueToScalar } from "../../core/graph/fieldModel";
import { useDataCollection } from "../../hooks/useDataCollection";
import { DEFAULT_LINKIFY_PROPS } from "../../utils/url";
import { BaseOption, CreatableSelect, optionize } from "../forms/Select";

/**
 * Render values:
 * **************
 */
export const AttributeRenderers: {
  [K in keyof FieldModelAbstraction]: FC<
    {
      value?: FieldModelAbstraction[K]["expectedOutput"];
    } & FieldModelAbstraction[K]["options"]
  >;
} = {
  text: ({ value }) => (!isNil(value) ? <ReactLinkify {...DEFAULT_LINKIFY_PROPS}>{value}</ReactLinkify> : null),
  number: ({ value }) => {
    const { i18n } = useTranslation();
    return !isNil(value) ? <>{value.toLocaleString(i18n.language)}</> : null;
  },
  category: ({ value }) => (!isNil(value) ? <span className="badge rounded-pill text-bg-dark">{value}</span> : null),
  keywords: ({ value }) =>
    value?.length ? (
      <span className="gap-1">
        {value.map((keyword, i) => (
          <span key={i} className="badge rounded-pill text-bg-dark">
            {keyword}
          </span>
        ))}
      </span>
    ) : null,
  date: ({ value, format }) => (!isNil(value) ? value.toFormat(format) : null),
};
export const RenderText = AttributeRenderers.text;
export const RenderNumber = AttributeRenderers.number;
export const RenderCategory = AttributeRenderers.category;
export const RenderKeywords = AttributeRenderers.keywords;
export const RenderDate = AttributeRenderers.date;

export const RenderItemAttribute: FC<{ field: FieldModelTypeSpec; value: Scalar }> = ({ field, value }) =>
  createElement(AttributeRenderers[field.type] as FC<{ value?: ModelValueType }>, {
    ...field,
    value: castScalarToModelValue(value, field),
  });

/**
 * Edit values:
 * ************
 */
export const AttributeEditors: {
  [K in FieldModelType]: FC<{
    value?: FieldModelAbstraction[K]["expectedOutput"];
    onChange: (value?: FieldModelAbstraction[K]["expectedOutput"]) => void;
    field: FieldModel<ItemType, false, K>;
  }>;
} = {
  text: ({ value, onChange }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (ref.current) ref.current.focus();
    }, []);

    return (
      <input
        ref={ref}
        autoFocus
        className="form-control"
        type="string"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  },
  number: ({ value, onChange }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (ref.current) ref.current.focus();
    }, []);

    return (
      <input
        ref={ref}
        autoFocus
        className="form-control"
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? +e.target.value : undefined)}
      />
    );
  },
  category: ({ value, onChange, field }) => {
    const values = useDataCollection(field);
    const options = useMemo(() => Array.from(values).map(optionize), [values]);
    const OptionComponent = useCallback((props: OptionProps<BaseOption, false>) => {
      const Option = components.Option<BaseOption, false, GroupBase<BaseOption>>;
      return (
        <Option {...props}>
          <RenderCategory value={props.data.value} />
        </Option>
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
        autoFocus
        menuPosition="absolute"
        value={!isNil(value) ? optionize(value) : undefined}
        onChange={(newValue) => onChange(newValue?.value)}
        options={options}
        components={{
          Option: OptionComponent,
          SingleValue: SingleValueComponent,
        }}
      />
    );
  },
  keywords: ({ value, onChange, field }) => {
    const values = useDataCollection(field);
    const options = useMemo(() => Array.from(values).map(optionize), [values]);
    const OptionComponent = useCallback(
      (props: OptionProps<BaseOption, true>) => {
        const Option = components.Option<BaseOption, true, GroupBase<BaseOption>>;
        return (
          <Option {...props}>
            <RenderKeywords value={[props.data.value]} separator={field.separator} />
          </Option>
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
        autoFocus
        menuPosition="absolute"
        value={value?.map(optionize)}
        onChange={(newValue) => onChange(newValue.length ? newValue.map((o) => o.value) : undefined)}
        options={options}
        components={{
          Option: OptionComponent,
          MultiValueContainer: MultiValueContainerComponent,
        }}
      />
    );
  },
  date: ({ value, onChange }) => (
    <input
      autoFocus
      className="form-control"
      type="datetime-local"
      value={value?.toFormat("yyyy-MM-dd'T'HH:mm") ?? ""}
      onChange={(e) => {
        const date = e.target.value ? DateTime.fromFormat(e.target.value, "yyyy-MM-dd'T'HH:mm") : undefined;
        onChange(date?.isValid ? date : undefined);
      }}
    />
  ),
};
export const EditText = AttributeEditors.text;
export const EditNumber = AttributeEditors.number;
export const EditCategory = AttributeEditors.category;
export const EditKeywords = AttributeEditors.keywords;
export const EditDate = AttributeEditors.date;

export const EditItemAttribute: FC<{ field: FieldModel; value: Scalar; onChange: (value: Scalar) => void }> = ({
  field,
  value,
  onChange,
}) => {
  const EditComponent = AttributeEditors[field.type] as FC<{
    value?: FieldModelAbstraction[FieldModelType]["expectedOutput"];
    onChange: (value?: FieldModelAbstraction[FieldModelType]["expectedOutput"]) => void;
    field: FieldModel;
  }>;

  return (
    <EditComponent
      value={castScalarToModelValue(value, field)}
      onChange={(value) => onChange(serializeModelValueToScalar(value, field))}
      field={field}
    />
  );
};

import { FieldModelAbstraction, FieldModelTypeSpec, ModelValueType, Scalar } from "@gephi/gephi-lite-sdk";
import { isNil } from "lodash";
import { DateTime } from "luxon";
import { FC, createElement } from "react";
import { useTranslation } from "react-i18next";
import ReactLinkify from "react-linkify";

import { castScalarToModelValue, serializeModelValueToScalar } from "../../core/graph/fieldModel";
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
  [K in keyof FieldModelAbstraction]: FC<
    {
      value?: FieldModelAbstraction[K]["expectedOutput"];
      onChange: (value?: FieldModelAbstraction[K]["expectedOutput"]) => void;
    } & FieldModelAbstraction[K]["options"]
  >;
} = {
  text: ({ value, onChange }) => (
    <input
      className="form-control"
      type="string"
      value={value || ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  ),
  number: ({ value, onChange }) => (
    <input
      className="form-control"
      type="number"
      value={value || ""}
      onChange={(e) => onChange(e.target.value ? +e.target.value : undefined)}
    />
  ),
  category: ({ value, onChange }) => {
    return (
      <CreatableSelect<BaseOption>
        menuPosition="absolute"
        value={!isNil(value) ? optionize(value) : undefined}
        onChange={(newValue) => onChange(newValue?.value)}
      />
    );
  },
  keywords: ({ value, onChange }) => {
    return (
      <CreatableSelect<BaseOption, true>
        menuPosition="absolute"
        isMulti
        value={value?.map(optionize)}
        onChange={(newValue) => onChange(newValue.length ? newValue.map((o) => o.value) : undefined)}
      />
    );
  },
  date: ({ value, onChange }) => (
    <input
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

export const EditItemAttribute: FC<{ field: FieldModelTypeSpec; value: Scalar; onChange: (value: Scalar) => void }> = ({
  field,
  value,
  onChange,
}) => {
  const EditComponent = AttributeEditors[field.type] as FC<{
    value?: ModelValueType;
    onChange: (value?: ModelValueType) => void;
  }>;

  return (
    <EditComponent
      value={castScalarToModelValue(value, field)}
      onChange={(value) => onChange(serializeModelValueToScalar(value, field))}
      {...field}
    />
  );
};

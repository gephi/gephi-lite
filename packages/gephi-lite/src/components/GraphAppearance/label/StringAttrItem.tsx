import { StringAttr } from "@gephi/gephi-lite-sdk";
import { sortBy } from "lodash";
import { FC, ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useAppearanceActions,
  useDynamicItemData,
  useGraphDataset,
} from "../../../core/context/dataContexts";
import { staticDynamicAttributeKey, staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { FieldModel } from "../../../core/graph/types";
import { ItemType } from "../../../core/types";
import { FieldModelIcon } from "../../common-icons";
import { Select } from "../../forms/Select";

type LabelOption =
  | { value: string; type: "none" | "fixed"; field?: undefined; label: string | ReactNode }
  | { value: string; type: "field"; field: FieldModel<ItemType, boolean>; label: string | ReactNode };

export const StringAttrItem: FC<{ itemType: ItemType; itemKey: "images" | "labels" }> = ({ itemType, itemKey }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const { nodesLabel, edgesLabel, nodesImage } = useAppearance();
  const { setLabelAppearance, setNodeImagesAppearance } = useAppearanceActions();
  const setValue = useCallback(
    (v: StringAttr) => (itemKey === "images" ? setNodeImagesAppearance(v) : setLabelAppearance(itemType, v)),
    [setLabelAppearance, setNodeImagesAppearance, itemKey, itemType],
  );

  const currentDef = itemKey === "images" ? nodesImage : itemType === "nodes" ? nodesLabel : edgesLabel;

  const labelOptions: LabelOption[] = useMemo(
    () => [
      { value: "none", type: "none", label: t(`appearance.${itemKey}.none`) },
      { value: "fixed", type: "fixed", label: t(`appearance.${itemKey}.fixed`) },
      ...sortBy(
        itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : [...edgeFields, ...dynamicEdgeFields],
        (field: FieldModel) => (field.type === "text" ? 0 : field.type === "url" ? 1 : 2),
      ).flatMap((field: FieldModel) =>
        itemKey !== "images" || field.type === "url"
          ? [
              {
                value: `field::${staticDynamicAttributeKey(field)}`,
                type: "field" as const,
                field,
                label: (
                  <>
                    <FieldModelIcon type={field.type} className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
              },
            ]
          : [],
      ),
    ],
    [nodeFields, edgeFields, dynamicNodeFields, dynamicEdgeFields, itemKey, itemType, t],
  );

  const selectedLabelOption: LabelOption | null = useMemo(
    () =>
      labelOptions.find((option) => {
        if (!currentDef.field) {
          return option.type === currentDef.type;
        }
        return (
          option.type === currentDef.type && option.field && currentDef.field && option.field.id === currentDef.field.id
        );
      }) || null,
    [labelOptions, currentDef.field, currentDef.type],
  );

  return (
    <div className="panel-block">
      <label htmlFor={`${itemType}-${itemKey}sMode`}>{t(`appearance.${itemKey}.set_labels_from`)}</label>
      <Select<LabelOption | null>
        id={`${itemType}-labelsMode`}
        options={labelOptions}
        value={selectedLabelOption}
        onChange={(option) => {
          if (!option) {
            setValue({
              type: "none",
            });
          } else if (option.type === "field") {
            setValue({
              type: "field",
              field: option.field,
              missingValue: null,
            });
          } else if (option.type === "fixed") {
            setValue({
              type: "fixed",
              value: itemKey === "images" ? "http://..." : "label",
            });
          } else {
            setValue({
              type: option.type,
            });
          }
        }}
      />

      {currentDef.type === "none" && (
        <p className="form-text small text-muted">
          {t(`appearance.${itemKey}.none_description`, { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {currentDef.type === "field" && (
        <div className="d-flex flex-column align-items-stretch gl-gap-1">
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-missingStringAttrValue`}>
            {t(`appearance.${itemKey}.default_value`, { items: t(`graph.model.${itemType}`) })}
          </label>
          <input
            className="form-control form-control-sm"
            type="string"
            value={currentDef.missingValue || ""}
            onChange={(v) => setValue({ ...currentDef, missingValue: v.target.value || null })}
            id={`${itemType}-missingStringAttrValue`}
          />
        </div>
      )}
      {currentDef.type === "fixed" && (
        <div className="d-flex flex-column align-items-stretch gl-gap-1">
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-fixedStringAttrValue`}>
            {t(`appearance.${itemKey}.fixed_label`, { items: t(`graph.model.${itemType}`) })}
          </label>
          <input
            className="form-control form-control-sm"
            type="string"
            value={currentDef.value}
            onChange={(v) => setValue({ ...currentDef, value: v.target.value })}
            id={`${itemType}-fixedStringAttrValue`}
          />
        </div>
      )}
    </div>
  );
};

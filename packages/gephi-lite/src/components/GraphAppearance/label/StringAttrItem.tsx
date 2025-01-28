import { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { StringAttr } from "../../../core/appearance/types";
import { useAppearance, useAppearanceActions, useGraphDataset } from "../../../core/context/dataContexts";
import { FieldModel } from "../../../core/graph/types";
import { ItemType } from "../../../core/types";
import { DEFAULT_SELECT_PROPS } from "../../consts";

type LabelOption =
  | { value: string; type: "none" | "data" | "fixed"; field?: undefined; label: string }
  | { value: string; type: "field"; field: string; label: string };

export const StringAttrItem: FC<{ itemType: ItemType; itemKey: "images" | "labels" }> = ({ itemType, itemKey }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { nodesLabel, edgesLabel, nodesImage } = useAppearance();
  const { setLabelAppearance, setNodeImagesAppearance } = useAppearanceActions();
  const setValue = useCallback(
    (v: StringAttr) => (itemKey === "images" ? setNodeImagesAppearance(v) : setLabelAppearance(itemType, v)),
    [setLabelAppearance, setNodeImagesAppearance, itemKey, itemType],
  );

  const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
  const currentDef = itemKey === "images" ? nodesImage : itemType === "nodes" ? nodesLabel : edgesLabel;
  const labelOptions = useMemo(() => {
    return [
      { value: "data", type: "data", label: t(`appearance.${itemKey}.data`) as string },
      ...allFields.map((field) => ({
        value: `field::${field.id}`,
        type: "field",
        field: field.id,
        label: field.id,
      })),
      { value: "fixed", type: "fixed", label: t(`appearance.${itemKey}.fixed`) as string },
      { value: "none", type: "none", label: t(`appearance.${itemKey}.none`) as string },
    ] as LabelOption[];
  }, [allFields, itemKey, t]);
  const selectedLabelOption: LabelOption | null = useMemo(
    () => labelOptions.find((option) => option.type === currentDef.type && option.field === currentDef.field) || null,
    [labelOptions, currentDef.field, currentDef.type],
  );

  return (
    <div className="panel-block">
      <h3 className="fs-5">{t(`appearance.${itemKey}.title`)}</h3>
      <label htmlFor={`${itemType}-${itemKey}sMode`}>{t(`appearance.${itemKey}.set_labels_from`)}</label>
      <Select<LabelOption>
        {...DEFAULT_SELECT_PROPS}
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

      {currentDef.type === "data" && (
        <p className="fst-italic text-muted small m-0">
          {t(`appearance.${itemKey}.data_description`, { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {currentDef.type === "none" && (
        <p className="fst-italic text-muted small m-0">
          {t(`appearance.${itemKey}.none_description`, { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {currentDef.type === "field" && (
        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm w-8"
            type="string"
            value={currentDef.missingValue || ""}
            onChange={(v) => setValue({ ...currentDef, missingValue: v.target.value || null })}
            id={`${itemType}-missingStringAttrValue`}
          />
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-missingStringAttrValue`}>
            {t(`appearance.${itemKey}.default_value`, { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      )}
      {currentDef.type === "fixed" && (
        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm w-8"
            type="string"
            value={currentDef.value}
            onChange={(v) => setValue({ ...currentDef, value: v.target.value })}
            id={`${itemType}-fixedStringAttrValue`}
          />
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-fixedStringAttrValue`}>
            {t(`appearance.${itemKey}.fixed_label`, { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      )}
    </div>
  );
};

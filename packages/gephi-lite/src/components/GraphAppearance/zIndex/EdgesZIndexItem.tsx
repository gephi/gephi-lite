import { FC, useMemo } from "react";
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
import { Select } from "../../forms/Select";

type LabelOption =
  | { value: string; type: "none"; field?: undefined; label: string }
  | { value: string; type: "field"; field: FieldModel<ItemType, boolean>; label: string };

export const EdgesZIndexItem: FC = () => {
  const itemType: ItemType = "edges";
  const { t } = useTranslation();
  const { edgeFields } = useGraphDataset();
  const { dynamicEdgeFields } = useDynamicItemData();
  const { edgesZIndex } = useAppearance();
  const { setEdgesZIndexAppearance } = useAppearanceActions();

  const numberFields: FieldModel<"edges", boolean>[] = [...edgeFields, ...dynamicEdgeFields].filter(
    (field) => field.type === "number",
  );
  const labelOptions = useMemo(() => {
    return [
      { value: "none", type: "none", label: t(`appearance.zIndex.none`) },
      ...numberFields.map((field) => {
        return {
          value: staticDynamicAttributeKey(field),
          type: "field",
          field,
          label: staticDynamicAttributeLabel(field),
        };
      }),
    ] as LabelOption[];
  }, [numberFields, t]);
  const selectedLabelOption: LabelOption | null = useMemo(
    () => labelOptions.find((option) => option.type === edgesZIndex.type && option.field === edgesZIndex.field) || null,
    [labelOptions, edgesZIndex.field, edgesZIndex.type],
  );

  return (
    <div className="panel-block">
      <h3>{t(`appearance.zIndex.title`)}</h3>
      <p>{t(`appearance.zIndex.description`, { items: t("graph.model.edges") })}</p>

      <label htmlFor={`${itemType}-zIndexMode`}>{t(`appearance.zIndex.set_values_from`)}</label>
      <Select<LabelOption | null>
        id={`${itemType}-zIndexMode`}
        options={labelOptions}
        value={selectedLabelOption}
        onChange={(option) => {
          if (!option) {
            setEdgesZIndexAppearance({
              type: "none",
            });
          } else if (option.type === "field") {
            setEdgesZIndexAppearance({
              type: "field",
              field: option.field,
              reversed: false,
            });
          } else {
            setEdgesZIndexAppearance({
              type: option.type,
            });
          }
        }}
      />

      {edgesZIndex.type === "none" && (
        <p className="fst-italic text-muted small m-0">
          {t(`appearance.zIndex.none_description`, { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {edgesZIndex.type === "field" && (
        <div className="form-check mt-1">
          <input
            className="form-check-input"
            type="checkbox"
            checked={edgesZIndex.reversed}
            onChange={(e) => setEdgesZIndexAppearance({ ...edgesZIndex, reversed: e.target.checked })}
            id="reverse-zindex-order"
          />
          <label className="form-check-label" htmlFor="reverse-zindex-order">
            {t("appearance.zIndex.reverse_order")}
          </label>
        </div>
      )}
    </div>
  );
};

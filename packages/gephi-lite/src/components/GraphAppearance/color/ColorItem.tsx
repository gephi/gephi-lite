import { ItemDataField } from "@gephi/gephi-lite-sdk";
import { isEqual } from "lodash";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Color } from "../../../core/appearance/types";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR, DEFAULT_SHADING_COLOR } from "../../../core/appearance/utils";
import {
  useAppearance,
  useAppearanceActions,
  useDynamicItemData,
  useGraphDataset,
} from "../../../core/context/dataContexts";
import { staticDynamicAttributeKey, staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { FieldModel } from "../../../core/graph/types";
import { uniqFieldvaluesAsStrings } from "../../../core/graph/utils";
import { ItemType } from "../../../core/types";
import { Select } from "../../forms/Select";
import { ColorFixedEditor } from "./ColorFixedEditor";
import { ColorPartitionEditor } from "./ColorPartitionEditor";
import { ColorRankingEditor } from "./ColorRankingEditor";
import { ShadingColorEditor } from "./ShadingColorEditor";
import { getPalette } from "./utils";

type ColorOption = { value: string; label: string | JSX.Element; field?: ItemDataField; type: string };

export const ColorItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodeData, edgeData, nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeData, dynamicEdgeData, dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const appearance = useAppearance();
  const { setColorAppearance, setShadingColorAppearance } = useAppearanceActions();

  const color = itemType === "nodes" ? appearance.nodesColor : appearance.edgesColor;
  const colorShading = itemType === "nodes" ? appearance.nodesShadingColor : appearance.edgesShadingColor;
  const baseValue = itemType === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const defaultShadingField = useMemo(
    () =>
      (itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : edgeFields).find((field) => field.quantitative),
    [edgeFields, itemType, nodeFields, dynamicNodeFields],
  );

  const options: ColorOption[] = useMemo(() => {
    const allFields: FieldModel<ItemType, boolean>[] =
      itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : [...edgeFields, ...dynamicEdgeFields];
    return [
      {
        value: "data",
        type: "data",
        label: (
          <>
            {t("appearance.color.data")} <small className="text-muted">{t("appearance.no_caption")}</small>
          </>
        ),
      },
      { value: "fixed", type: "fixed", label: t("appearance.color.fixed") as string },
      ...(itemType === "edges"
        ? [
            { value: "source", type: "source", label: t("appearance.color.source") as string },
            { value: "target", type: "target", label: t("appearance.color.target") as string },
          ]
        : []),
      ...allFields.flatMap((field) => {
        const options: ColorOption[] = [];
        const staticDynamicField = { field: field.id, dynamic: field.dynamic };
        if (!!field.quantitative)
          options.push({
            value: `ranking::${staticDynamicAttributeKey(staticDynamicField)}`,
            field: staticDynamicField,
            type: "ranking",
            label: (
              <>
                {staticDynamicAttributeLabel(staticDynamicField)}{" "}
                <small className="text-muted">({t("appearance.color.quanti")})</small>
              </>
            ),
          });
        if (!!field.qualitative)
          options.push({
            value: `partition::${staticDynamicAttributeKey(staticDynamicField)}`,
            field: staticDynamicField,
            type: "partition",
            label: (
              <>
                {staticDynamicAttributeLabel(staticDynamicField)}{" "}
                <small className="text-muted">({t("appearance.color.quali")})</small>
              </>
            ),
          });
        return options;
      }),
    ];
  }, [edgeFields, itemType, nodeFields, dynamicNodeFields, dynamicEdgeFields, t]);
  const selectedOption =
    options.find((option) => {
      if (!color.field) {
        return color.type === option.type;
      }
      return option.type === color.type && option.field && color.field && option.field.field === color.field.field;
    }) || options[0];

  return (
    <div className="panel-block">
      <h3 className="fs-5">{t("appearance.color.title")}</h3>
      <label htmlFor={`${itemType}-colorMode`}>{t("appearance.color.set_color_from")}</label>
      <Select<ColorOption>
        id={`${itemType}-colorMode`}
        options={options}
        value={selectedOption}
        onChange={(option) => {
          if (isEqual(selectedOption, option)) return;

          if (!option || option.value === "fixed") {
            if (color.type !== "fixed") {
              setColorAppearance(itemType, {
                type: "fixed",
                value: baseValue,
              });
            }
          } else if (!option.field) {
            setColorAppearance(itemType, {
              type: option.type, // this is here to trick TS for nodes
            } as Color);
          } else {
            if (option.type === "ranking") {
              setColorAppearance(itemType, {
                type: "ranking",
                field: option.field,
                colorScalePoints: [
                  { scalePoint: 0, color: "#fc8d59" },
                  { scalePoint: 0.5, color: "#ffffbf" },
                  { scalePoint: 1, color: "#91bfdb" },
                ],
                missingColor: baseValue,
              });
            } else {
              const field = option.field;
              let values: string[] = [];

              if (field.dynamic) {
                const itemsData = itemType === "nodes" ? dynamicNodeData : dynamicEdgeData;
                values = uniqFieldvaluesAsStrings(itemsData, field.field);
              } else {
                const itemsData = itemType === "nodes" ? nodeData : edgeData;
                values = uniqFieldvaluesAsStrings(itemsData, field.field);
              }

              setColorAppearance(itemType, {
                type: "partition",
                field,
                colorPalette: getPalette(values),
                missingColor: baseValue,
              });
            }
          }
        }}
      />

      {(color.type === "data" || color.type === "source" || color.type === "target") && (
        <p className="fst-italic text-muted small m-0">
          {t(`appearance.color.${color.type}_description`, { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {color.type === "fixed" && (
        <ColorFixedEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
      {color.type === "ranking" && (
        <ColorRankingEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
      {color.type === "partition" && (
        <ColorPartitionEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}

      {/* Colors shading */}
      {(colorShading || defaultShadingField) && (
        <div className="form-check mt-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={!!colorShading}
            onChange={(e) => {
              if (!defaultShadingField) return;
              setShadingColorAppearance(
                itemType,
                e.target.checked
                  ? {
                      type: "shading",
                      targetColor: DEFAULT_SHADING_COLOR,
                      field: { field: defaultShadingField.id, dynamic: defaultShadingField.dynamic },
                      factor: 0.5,
                    }
                  : undefined,
              );
            }}
            id={`${itemType}-enableColorShading`}
          />
          <label className="form-check-label" htmlFor={`${itemType}-enableColorShading`}>
            {t("appearance.color.enable_color_shading", { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      )}
      {colorShading && (
        <ShadingColorEditor
          itemType={itemType}
          color={colorShading}
          setColor={(newColor) => setShadingColorAppearance(itemType, newColor)}
        />
      )}
    </div>
  );
};

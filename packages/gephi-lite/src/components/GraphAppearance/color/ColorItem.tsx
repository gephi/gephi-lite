import { Color, DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR, DEFAULT_SHADING_COLOR, EdgeColor } from "@gephi/gephi-lite-sdk";
import { isEqual } from "lodash";
import { FC, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useAppearanceActions,
  useDynamicItemData,
  useGraphDataset,
} from "../../../core/context/dataContexts";
import { staticDynamicAttributeKey, staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { FieldModel } from "../../../core/graph/types";
import { uniqFieldValuesAsStrings } from "../../../core/graph/utils";
import { ItemType } from "../../../core/types";
import { FieldModelIcons } from "../../common-icons";
import { Select } from "../../forms/Select";
import { ColorFieldEditor } from "./ColorFieldEditor";
import { ColorFixedEditor } from "./ColorFixedEditor";
import { ColorPartitionEditor } from "./ColorPartitionEditor";
import { ColorRankingEditor } from "./ColorRankingEditor";
import { ShadingColorEditor } from "./ShadingColorEditor";
import { getPalette } from "./utils";

type ColorOption = {
  value: string;
  label: string | ReactNode;
  field?: FieldModel<ItemType, boolean>;
  type: EdgeColor["type"] | "unsupported";
};

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
      (itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : edgeFields).find(
        (field) => field.type === "number",
      ),
    [edgeFields, itemType, nodeFields, dynamicNodeFields],
  );

  const options: ColorOption[] = useMemo(() => {
    const allFields: FieldModel<ItemType, boolean>[] =
      itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : [...edgeFields, ...dynamicEdgeFields];
    const FixedOption: ColorOption = { value: "fixed", type: "fixed", label: t("appearance.color.fixed") };
    const edgeOptions: ColorOption[] = [
      { value: "source", type: "source", label: t("appearance.color.source") },
      { value: "target", type: "target", label: t("appearance.color.target") },
    ];
    return [
      FixedOption,
      ...(itemType === "edges" ? edgeOptions : []),
      ...allFields
        .filter((f): f is FieldModel<ItemType, boolean> => ["date", "number", "category", "color"].includes(f.type))
        .map((field): ColorOption => {
          const Icon = FieldModelIcons[field.type];
          switch (field.type) {
            case "date":
            case "number":
              return {
                value: `ranking::${staticDynamicAttributeKey(field)}`,
                field,
                type: "ranking",
                label: (
                  <>
                    <Icon className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
              };
            case "category":
              return {
                value: `partition::${staticDynamicAttributeKey(field)}`,
                field: field,
                type: "partition",
                label: (
                  <>
                    <Icon className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
              };
            case "color":
            default:
              return {
                value: `field::${staticDynamicAttributeKey(field)}`,
                field: field,
                type: "field",
                label: (
                  <>
                    <Icon className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
              };
          }
        }),
      // unsupported options are listed after the supported ones
      ...allFields
        .filter((f): f is FieldModel<ItemType, boolean> => !["date", "number", "category"].includes(f.type))
        .map((field): ColorOption => {
          const Icon = FieldModelIcons[field.type];
          return {
            value: `unsupported::${staticDynamicAttributeKey(field)}`,
            field,
            type: "unsupported",
            label: (
              <>
                <Icon className="me-1" />
                {staticDynamicAttributeLabel(field)}
              </>
            ),
          };
        }),
    ];
  }, [edgeFields, itemType, nodeFields, dynamicNodeFields, dynamicEdgeFields, t]);
  const selectedOption =
    options.find((option) => {
      if (!color.field) {
        return color.type === option.type;
      }
      return option.type === color.type && option.field && color.field && option.field.id === color.field.id;
    }) || options[0];

  return (
    <div className="panel-block">
      <h3>{t("appearance.color.title")}</h3>

      <div className="panel-block">
        <label htmlFor={`${itemType}-colorMode`}>{t("appearance.color.set_color_from")}</label>
        <Select<ColorOption>
          id={`${itemType}-colorMode`}
          options={options}
          value={selectedOption}
          isOptionDisabled={(option) => option.type === "unsupported"}
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
            } else if (option.type === "ranking") {
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
            } else if (option.type === "partition") {
              const field = option.field;
              let values: string[];

              if (field.dynamic) {
                const itemsData = itemType === "nodes" ? dynamicNodeData : dynamicEdgeData;
                values = uniqFieldValuesAsStrings(itemsData, field.id);
              } else {
                const itemsData = itemType === "nodes" ? nodeData : edgeData;
                values = uniqFieldValuesAsStrings(itemsData, field.id);
              }

              setColorAppearance(itemType, {
                type: "partition",
                field,
                colorPalette: getPalette(values),
                missingColor: baseValue,
              });
            } else {
              const field = option.field;

              setColorAppearance(itemType, {
                type: "field",
                field,
                missingColor: baseValue,
              });
            }
          }}
        />

        {(color.type === "source" || color.type === "target") && (
          <p className="form-text text-muted">
            {t(`appearance.color.${color.type}_description`, { items: t(`graph.model.${itemType}`) })}
          </p>
        )}
      </div>

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
          key={color.field.id}
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
      {color.type === "field" && (
        <ColorFieldEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}

      {/* Colors shading */}
      {(colorShading || defaultShadingField) && (
        <div className="panel-block">
          <div className="form-check">
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
                        field: defaultShadingField,
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

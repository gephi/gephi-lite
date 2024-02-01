import { flatMap, isEqual, uniq } from "lodash";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { Color } from "../../../core/appearance/types";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR } from "../../../core/appearance/utils";
import { useAppearance, useAppearanceActions, useGraphDataset } from "../../../core/context/dataContexts";
import { graphDatasetAtom } from "../../../core/graph";
import { FieldModel } from "../../../core/graph/types";
import { ItemType } from "../../../core/types";
import { DEFAULT_SELECT_PROPS } from "../../consts";
import { ColorFixedEditor } from "./ColorFixedEditor";
import { ColorPartitionEditor } from "./ColorPartitionEditor";
import { ColorRankingEditor } from "./ColorRankingEditor";
import { getPalette } from "./utils";

type ColorOption = { value: string; label: string | JSX.Element; field?: string; type: string };

export const ColorItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const appearance = useAppearance();
  const { setColorAppearance } = useAppearanceActions();

  const color = itemType === "nodes" ? appearance.nodesColor : appearance.edgesColor;
  const baseValue = itemType === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;

  const options: ColorOption[] = useMemo(() => {
    const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
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
        const options = [];
        if (!!field.quantitative)
          options.push({
            value: `ranking::${field.id}`,
            field: field.id,
            type: "ranking",
            label: (
              <>
                {field.id} <small className="text-muted">({t("appearance.color.quanti")})</small>
              </>
            ),
          });
        if (!!field.qualitative)
          options.push({
            value: `partition::${field.id}`,
            field: field.id,
            type: "partition",
            label: (
              <>
                {field.id} <small className="text-muted">({t("appearance.color.quali")})</small>
              </>
            ),
          });
        return options;
      }),
    ];
  }, [edgeFields, itemType, nodeFields, t]);
  const selectedOption =
    options.find((option) => option.type === color.type && option.field === color.field) || options[0];

  return (
    <div className="panel-block">
      <h3 className="fs-5">{t("appearance.color.title")}</h3>
      <label htmlFor={`${itemType}-colorMode`}>{t("appearance.color.set_color_from")}</label>
      <Select<ColorOption>
        {...DEFAULT_SELECT_PROPS}
        id={`${itemType}-colorMode`}
        options={options}
        value={selectedOption}
        onChange={(option) => {
          if (isEqual(selectedOption, option)) return;

          if (!option || option.value === "fixed") {
            if (color.type !== "fixed") {
              setColorAppearance(itemType, {
                itemType,
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
                itemType,
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
              const field = option.field as string;
              const values = uniq(
                flatMap(graphDatasetAtom.get()[itemType === "nodes" ? "nodeData" : "edgeData"], (itemData) => {
                  const v = itemData[field];
                  if (typeof v === "number" || (typeof v === "string" && !!v)) return [v + ""];
                  return [];
                }),
              ) as string[];

              setColorAppearance(itemType, {
                itemType,
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
    </div>
  );
};

import cx from "classnames";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Color, EdgeColor, ShadingColor } from "../../core/appearance/types";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { CaptionItemTitle } from "./CaptionItemTitle";
import { ColorSlider } from "./ColorSlider";
import { GraphCaptionProps, PartitionExtends, RangeExtends } from "./types";
import { getPartitionCaptionRows } from "./utils";

export const ItemsColorCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    itemType: "nodes" | "edges";
    itemsColor: Color | EdgeColor;
    itemsShadingColor?: ShadingColor;
    extend?: RangeExtends | PartitionExtends;
  }
> = ({ itemType, minimal, itemsColor, itemsShadingColor, extend }) => {
  const { t } = useTranslation();
  let result: ReactNode = null;

  if (itemsShadingColor)
    result = (
      <p className="small color-shade-caption mt-2 mb-0">
        <span className="text-muted">
          {t(`appearance.color.shading_caption_1`, {
            items: t(`graph.model.${itemType}`),
            attribute: staticDynamicAttributeLabel(itemsShadingColor.field),
          })}
        </span>{" "}
        <span
          className={cx("d-inline-block ms-1", itemType === "nodes" && "disc", itemType === "edges" && "rectangle")}
          style={{ backgroundColor: itemsShadingColor.targetColor }}
        />{" "}
        <span className="text-muted">
          {t(`appearance.color.shading_caption_2`, {
            items: t(`graph.model.${itemType}`),
            attribute: staticDynamicAttributeLabel(itemsShadingColor.field),
          })}
        </span>
      </p>
    );

  if (itemsColor.field)
    result = (
      <>
        <CaptionItemTitle
          itemType={itemType}
          field={staticDynamicAttributeLabel(itemsColor.field)}
          vizVariable="color"
        />

        {/* PARTITION */}
        {extend && itemsColor.type === "partition" && "occurrences" in extend && (
          <div className={cx(minimal && "minimal", "item-colors partition")}>
            {getPartitionCaptionRows(
              itemsColor.colorPalette,
              itemsColor.missingColor,
              extend,
              t("appearance.color.other_values"),
            ).map(({ label, color, count, isOther }) => (
              <div
                key={isOther ? "\0other" : label}
                title={`${itemsColor.field}: ${label} ${count} ${t(`graph.model.${itemType}`, { count })}`}
              >
                <span
                  className={cx(itemType === "nodes" && "disc", itemType === "edges" && "rectangle", "flex-shrink-0")}
                  style={{ backgroundColor: color }}
                />
                <span className={cx("label", isOther && "fst-italic")}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* RANKING */}
        {extend && itemsColor.type === "ranking" && "min" in extend && (
          <div className={cx(minimal && "minimal", "item-colors ranking")}>
            <ColorSlider colorScalePoints={itemsColor.colorScalePoints} extend={extend} />
          </div>
        )}

        {result}
      </>
    );
  else if (itemsColor.type === "source" || itemsColor.type === "target")
    result = (
      <>
        <CaptionItemTitle itemType={itemType} field={t(`appearance.color.${itemsColor.type}`)} vizVariable="color" />
      </>
    );

  return result && <div className="graph-caption-item">{result}</div>;
};

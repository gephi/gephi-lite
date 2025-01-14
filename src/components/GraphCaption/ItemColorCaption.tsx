import cx from "classnames";
import { sortBy, toPairs } from "lodash";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { GraphCaptionProps, PartitionExtends, RangeExtends } from ".";
import { Color, EdgeColor, RefinementColor } from "../../core/appearance/types";
import { CaptionItemTitle } from "./CaptionItemTitle";
import { ColorSlider } from "./ColorSlider";

export const ItemsColorCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    itemType: "node" | "edge";
    itemsColor: Color | EdgeColor;
    itemsRefinementColor?: RefinementColor;
    extend?: RangeExtends | PartitionExtends;
  }
> = ({ itemType, minimal, itemsColor, itemsRefinementColor, extend }) => {
  const { t } = useTranslation();
  let result: ReactNode = null;

  if (itemsColor.field)
    result = (
      <>
        <CaptionItemTitle itemType={itemType} field={itemsColor.field} vizVariable="color" />

        {/* PARTITION */}
        {extend && itemsColor.type === "partition" && "occurrences" in extend && (
          <div className={cx(minimal && "minimal", "item-colors partition")}>
            {[
              ...sortBy(
                toPairs(itemsColor.colorPalette).filter(([label]) => extend.occurrences[label]),
                ([label]) => -1 * extend.occurrences[label],
              ),
              ...(extend.missing ? [["N/A", itemsColor.missingColor]] : []),
            ].map(([label, color]) => (
              <div
                key={label}
                title={`${itemsColor.field}: ${label} ${extend.occurrences[label]} ${t(`graph.model.${itemType}s`, {
                  count: extend.occurrences[label],
                })}`}
              >
                <span
                  className={cx(itemType === "node" && "disc", itemType === "edge" && "rectangle", "flex-shrink-0")}
                  style={{ backgroundColor: color }}
                />
                <span className="label">{label}</span>
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
      </>
    );
  else if (itemsColor.type === "source" || itemsColor.type === "target")
    result = (
      <>
        <CaptionItemTitle itemType={itemType} field={t(`appearance.color.${itemsColor.type}`)} vizVariable="color" />
      </>
    );

  if (itemsRefinementColor)
    result = (
      <>
        {result}
        <p className="small">
          <span className="text-muted">Edges with high</span> {itemsRefinementColor.field}{" "}
          <span className="text-muted">
            tend to the color{" "}
            <span
              className={cx("d-inline-block ms-1", itemType === "node" && "disc", itemType === "edge" && "rectangle")}
              style={{ backgroundColor: itemsRefinementColor.targetColor }}
            />
            .
          </span>
        </p>
      </>
    );

  return result && <div className="graph-caption-item">{result}</div>;
};

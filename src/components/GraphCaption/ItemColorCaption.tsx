import { FC } from "react";
import { capitalize, sortBy, toPairs } from "lodash";
import cx from "classnames";

import { Color } from "../../core/appearance/types";
import { GraphCaptionProps, PartitionExtends, RangeExtends } from ".";
import { useTranslation } from "react-i18next";
import { ColorSlider } from "./ColorSlider";

export const ItemsColorCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    itemType: "node" | "edge";
    itemsColor: Color;
    extend: RangeExtends | PartitionExtends;
  }
> = ({ itemType, minimal, itemsColor, extend }) => {
  const { t } = useTranslation();

  if (itemsColor.field)
    return (
      <div className="graph-caption-item">
        <h4 className="fs-6">
          {t("graph.caption.color", { itemType: capitalize(t(`graph.model.${itemType}s`, { count: 2 }) + "") })}{" "}
          {itemsColor.field}
        </h4>
        {/* PARTITION */}
        {itemsColor.type === "partition" && "occurrences" in extend && (
          <div className={cx(minimal && "minimal", "item-colors partition")}>
            {[
              ...sortBy(
                toPairs(itemsColor.colorPalette).filter(([label]) => extend.occurrences[label]),
                ([label]) => -1 * extend.occurrences[label],
              ),
              ...(extend.missing ? [["N/A", itemsColor.missingColor]] : []),
            ].map(([label, color]) => (
              <div
                title={`${itemsColor.field}: ${label} ${extend.occurrences[label]} ${t(`graph.model.${itemType}s`, {
                  count: extend.occurrences[label],
                })}`}
              >
                <span
                  key={label}
                  className={cx(itemType === "node" && "disc", itemType === "edge" && "rectangle", "flex-shrink-0")}
                  style={{ backgroundColor: color }}
                />
                <span className="label">{label}</span>
              </div>
            ))}
          </div>
        )}
        {/* RANKING */}
        {itemsColor.type === "ranking" && "min" in extend && (
          <div className={cx(minimal && "minimal", "item-colors ranking")}>
            <ColorSlider colorScalePoints={itemsColor.colorScalePoints} extend={extend} itemType={itemType} />
          </div>
        )}
      </div>
    );
  return null;
};

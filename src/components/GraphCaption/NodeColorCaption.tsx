import { FC } from "react";
import { sortBy, toPairs } from "lodash";
import cx from "classnames";

import { Color } from "../../core/appearance/types";
import { GraphCaptionProps, PartitionExtends, RangeExtends } from ".";
import { useTranslation } from "react-i18next";
import { ColorSlider } from "./ColorSlider";

export const NodesColorCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    nodesColor: Color;
    extend: RangeExtends | PartitionExtends;
  }
> = ({ minimal, nodesColor, extend }) => {
  const { t } = useTranslation();

  if (nodesColor.field)
    return (
      <div className="graph-caption-item">
        <h4 className="fs-6">{nodesColor.field}</h4>
        {/* PARTITION */}
        {nodesColor.type === "partition" && "occurrences" in extend && (
          <div className={cx(minimal && "minimal", "node-colors partition")}>
            {[
              ...sortBy(
                toPairs(nodesColor.colorPalette).filter(([label]) => extend.occurrences[label]),
                ([label]) => -1 * extend.occurrences[label],
              ),
              ...(extend.missing ? [["N/A", nodesColor.missingColor]] : []),
            ].map(([label, color]) => (
              <div
                title={`${nodesColor.field}: ${label} ${extend.occurrences[label]} ${t("graph.model.nodes", {
                  count: extend.occurrences[label],
                })}`}
              >
                <span key={label} className={"disc flex-shrink-0"} style={{ backgroundColor: color }} />
                <span className="label">{label}</span>
              </div>
            ))}
          </div>
        )}
        {/* RANKING */}
        {nodesColor.type === "ranking" && "min" in extend && (
          <div className={cx(minimal && "minimal", "node-colors ranking")}>
            <ColorSlider colorScalePoints={nodesColor.colorScalePoints} extend={extend} />
          </div>
        )}
      </div>
    );
  return null;
};

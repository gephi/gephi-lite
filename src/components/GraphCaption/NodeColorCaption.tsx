import { FC } from "react";
import { sortBy, toPairs } from "lodash";
import cx from "classnames";

import { Color } from "../../core/appearance/types";
import { GraphCaptionProps, PartitionExtends, RangeExtends } from ".";
import { useTranslation } from "react-i18next";
import { shortenNumber } from "../GraphFilters/utils";

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
        {nodesColor.type === "ranking" && "min" in extend && (
          <div className={cx(minimal && "minimal", "node-colors ranking")}>
            <div className="ranking-container">
              {nodesColor.colorScalePoints.map((scalePoint) => (
                <div style={{ left: `${scalePoint.scalePoint * 100}%` }}>
                  <span
                    key={scalePoint.scalePoint}
                    className={"disc flex-shrink-0"}
                    style={{ backgroundColor: scalePoint.color }}
                  />
                  <span className="label">
                    {shortenNumber(
                      scalePoint.scalePoint === 0
                        ? extend.min
                        : scalePoint.scalePoint === 1
                        ? extend.max
                        : scalePoint.scalePoint * extend.max - extend.min,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  return null;
};

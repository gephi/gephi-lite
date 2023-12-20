import { FC, useCallback, useEffect, useState } from "react";
import cx from "classnames";

import { GraphCaptionProps, RangeExtends } from ".";
import { Size } from "../../core/appearance/types";
import { shortenNumber } from "../GraphFilters/utils";
import { useSigmaAtom, useVisualGetters } from "../../core/context/dataContexts";

import { CaptionItemTitle } from "./CaptionItemTitle";

const ItemSizeCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    itemType: "node" | "edge";
    itemsSize: Size;
    extend?: RangeExtends;
  }
> = ({ minimal, itemType, itemsSize, extend }) => {
  const sigma = useSigmaAtom();
  // update nodeSize Size to camera updates from Sigma
  const visualGetters = useVisualGetters();
  const getItemSize = itemType === "node" ? visualGetters.getNodeSize : visualGetters.getEdgeSize;

  const [itemSizeState, setItemSizeState] = useState<
    | {
        minValue: number;
        minSize: number;
        maxValue: number;
        maxSize: number;
      }
    | undefined
  >(undefined);

  const refreshState = useCallback(() => {
    if (!sigma || !itemsSize.field || !extend || !getItemSize || !extend) return null;

    setItemSizeState({
      minValue: extend.min,
      minSize: sigma.scaleSize(getItemSize({ [itemsSize.field]: extend.min })) * (itemType === "node" ? 2 : 1),
      maxValue: extend.max,
      maxSize: sigma.scaleSize(getItemSize({ [itemsSize.field]: extend.max })) * (itemType === "node" ? 2 : 1),
    });
  }, [getItemSize, sigma, itemsSize.field, extend, itemType]);

  // Refresh caption when metric changes:
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Refresh caption on camera update:
  useEffect(() => {
    if (!refreshState) return;

    sigma.getCamera().addListener("updated", refreshState);
    return () => {
      sigma.getCamera().removeListener("updated", refreshState);
    };
  }, [sigma, refreshState]);

  if (itemsSize.field) {
    return (
      <div className="graph-caption-item">
        <CaptionItemTitle
          vizVariable="size"
          itemType={itemType}
          field={itemsSize.field}
          transformationMethod={itemsSize.transformationMethod}
        />
        {itemSizeState && (
          <div className="item-sizes">
            <div className="item-size">
              <div className="item-wrapper">
                <div
                  className={cx(itemType === "node" ? "dotted-circle" : "dotted-rectangle")}
                  style={{
                    width: itemSizeState?.minSize,
                    height: itemSizeState?.minSize,
                  }}
                />
              </div>
              <div className="caption text-center">{shortenNumber(itemSizeState?.minValue)}</div>
            </div>
            <div className="item-size">
              <div className="item-wrapper">
                <div
                  className={cx(itemType === "node" ? "dotted-circle" : "dotted-rectangle")}
                  style={{
                    width: itemSizeState?.maxSize,
                    height: itemSizeState?.maxSize,
                  }}
                />
              </div>
              <div className="caption text-center">{shortenNumber(itemSizeState?.maxValue)}</div>
            </div>
          </div>
        )}
      </div>
    );
  } else return null;
};

export default ItemSizeCaption;

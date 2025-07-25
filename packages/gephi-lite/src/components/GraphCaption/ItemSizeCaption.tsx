import { ItemType, Size } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";

import { useSigmaAtom, useVisualGetters } from "../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { CaptionItemTitle } from "./CaptionItemTitle";
import { GraphCaptionProps, RangeExtends } from "./index";

const ItemSizeCaption: FC<
  Pick<GraphCaptionProps, "minimal"> & {
    itemType: ItemType;
    itemsSize: Size;
    extend?: RangeExtends;
  }
> = ({ itemType, itemsSize, extend }) => {
  const sigma = useSigmaAtom();
  // update nodeSize Size to camera updates from Sigma
  const visualGetters = useVisualGetters();
  const getItemSize = itemType === "nodes" ? visualGetters.getNodeSize : visualGetters.getEdgeSize;

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
      minSize: sigma.scaleSize(getItemSize(extend.minValue)) * (itemType === "nodes" ? 2 : 1),
      maxValue: extend.max,
      maxSize: sigma.scaleSize(getItemSize(extend.maxItemData)) * (itemType === "nodes" ? 2 : 1),
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

  if (itemsSize.field && typeof itemsSize.minSize === "number") {
    return (
      <div className="graph-caption-item">
        <CaptionItemTitle
          vizVariable="size"
          itemType={itemType}
          field={staticDynamicAttributeLabel(itemsSize.field)}
          transformationMethod={itemsSize.transformationMethod}
        />
        {itemSizeState && (
          <div className="item-sizes">
            <div className="item-size">
              <div className="item-wrapper">
                <div
                  className={cx(itemType === "nodes" ? "dotted-circle" : "dotted-rectangle")}
                  style={{
                    width: itemSizeState?.minSize,
                    height: itemSizeState?.minSize,
                  }}
                />
              </div>
              <div className="caption text-center">
                {extend?.getLabel(
                  itemSizeState?.minValue,
                  itemSizeState?.maxValue && itemSizeState?.minValue
                    ? itemSizeState?.maxValue - itemSizeState?.minValue
                    : undefined,
                )}
              </div>
            </div>
            <div className="item-size">
              <div className="item-wrapper">
                <div
                  className={cx(itemType === "nodes" ? "dotted-circle" : "dotted-rectangle")}
                  style={{
                    width: itemSizeState?.maxSize,
                    height: itemSizeState?.maxSize,
                  }}
                />
              </div>
              <div className="caption text-center">
                {extend?.getLabel(
                  itemSizeState?.maxValue,
                  itemSizeState?.maxValue && itemSizeState?.minValue
                    ? itemSizeState?.maxValue - itemSizeState?.minValue
                    : undefined,
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ItemSizeCaption;

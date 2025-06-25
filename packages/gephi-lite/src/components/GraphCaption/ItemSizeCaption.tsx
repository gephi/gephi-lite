import { ItemType } from "@gephi/gephi-lite-sdk";
import cx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";

import { Size } from "../../core/appearance/types";
import { useSigmaAtom, useVisualGetters } from "../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { shortenNumber } from "../GraphFilters/utils";
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
      minSize:
        sigma.scaleSize(
          getItemSize({
            static: itemsSize.field.dynamic ? {} : { [itemsSize.field.id]: extend.min },
            dynamic: itemsSize.field.dynamic ? { [itemsSize.field.id]: extend.min } : {},
          }),
        ) * (itemType === "nodes" ? 2 : 1),
      maxValue: extend.max,
      maxSize:
        sigma.scaleSize(
          getItemSize({
            static: itemsSize.field.dynamic ? {} : { [itemsSize.field.id]: extend.max },
            dynamic: itemsSize.field.dynamic ? { [itemsSize.field.id]: extend.max } : {},
          }),
        ) * (itemType === "nodes" ? 2 : 1),
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
                {shortenNumber(
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
                {shortenNumber(
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
  } else return null;
};

export default ItemSizeCaption;

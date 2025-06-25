import { ItemData } from "@gephi/gephi-lite-sdk";
import { Column } from "@tanstack/react-table";
import { CSSProperties, ComponentType, FC, PropsWithChildren, createElement } from "react";
import { PiArrowDown, PiArrowUp, PiArrowsDownUp } from "react-icons/pi";

export type ItemRow = { id: string; selected: boolean; data: ItemData };

export const ARROWS = {
  asc: PiArrowDown,
  desc: PiArrowUp,
  both: PiArrowsDownUp,
} as const;
type ArrowType = keyof typeof ARROWS;

export const Arrow: FC<{
  arrow?: ArrowType | null;
  className?: string;
  wrapper?: ComponentType<PropsWithChildren>;
}> = ({ arrow, className, wrapper }) => {
  const ArrowIcon = arrow && ARROWS[arrow];
  if (!ArrowIcon) return null;
  if (wrapper) return createElement(wrapper, {}, <ArrowIcon className={className} />);

  return <ArrowIcon className={className} />;
};

export const SPECIFIC_COLUMNS = {
  id: "id",
  selected: "selected",
  preview: "preview",
} as const;

export const getCommonPinningStyles = (column: Column<ItemRow>, isInHead?: boolean): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left");

  return {
    borderRightWidth: isLastLeftPinnedColumn ? 2 : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? (isInHead ? 3 : 1) : undefined,
  };
};

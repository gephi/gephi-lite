import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, ReactNode, useEffect, useState } from "react";
import AnimateHeight from "react-animate-height";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";
import TetherComponent from "react-tether";

import { CaretDownIcon, CaretRightIcon } from "./common-icons";

type MenuCommon<T = unknown> = {
  id: string;
} & (
  | { label: ReactNode }
  | {
      i18nKey: string;
      capitalize?: boolean;
      icon?: {
        normal: IconType;
        fill: IconType;
      };
    }
) &
  T;
type MenuButton<T> = MenuCommon<T> & { type?: "button" };
type MenuText<T> = MenuCommon<T> & { type: "text"; className?: string };
type MenuSimpleItem<T> = MenuButton<T> | MenuText<T>;
type MenuSection<T> = MenuSimpleItem<T> & { children: MenuSimpleItem<T>[] };
export type MenuItem<T = unknown> = MenuSimpleItem<T> | MenuSection<T>;

const ItemMenuInner: FC<{ item: MenuItem; isOpened?: boolean; isSelected?: boolean }> = ({
  item,
  isOpened,
  isSelected,
}) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center w-100">
      {"label" in item ? (
        <span className="side-menu-item">{item.label}</span>
      ) : (
        <>
          {item.icon && (
            <span className="side-menu-icon">{isSelected ? <item.icon.fill /> : <item.icon.normal />}</span>
          )}
          <span className="side-menu-item">{item.capitalize ? capitalize(t(item.i18nKey)) : t(item.i18nKey)}</span>
        </>
      )}
      {isOpened !== undefined && <span>{isOpened ? <CaretDownIcon /> : <CaretRightIcon />}</span>}
    </div>
  );
};

function SimpleItem<T = unknown>({
  item,
  selected,
  onSelectedChange,
}: {
  item: MenuSimpleItem<T>;
  selected?: string;
  onSelectedChange: (item: MenuItem<T>) => void;
}) {
  return item.type === "text" ? (
    <span className={cx("gl-btnlike", item.className)}>
      <ItemMenuInner item={item} />
    </span>
  ) : (
    <button
      className={cx("gl-btn w-100 text-start", selected === item.id && "gl-btn-fill")}
      onClick={() => onSelectedChange(item)}
    >
      <ItemMenuInner item={item} isSelected={selected === item.id} />
    </button>
  );
}

function ExpandableItem<T = unknown>({
  item,
  selected,
  onSelectedChange,
}: {
  item: MenuSection<T>;
  selected?: string;
  onSelectedChange: (item: MenuItem<T>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isHovered) {
      setShowTooltip(true);
      return;
    }

    const id = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
    return () => {
      clearTimeout(id);
    };
  }, [isHovered]);

  const childrenMenuContent = item.children.map((item) => (
    <li key={item.id}>
      <SimpleItem item={item} selected={selected} onSelectedChange={onSelectedChange} />
    </li>
  ));

  return (
    <>
      <TetherComponent
        className="over-modal"
        attachment="top left"
        targetAttachment="top right"
        constraints={[{ to: "window", attachment: "together", pin: true }]}
        renderTarget={(ref) => (
          <button
            ref={ref}
            className="gl-btn w-100 text-start"
            onClick={() => {
              setIsExpanded((v) => !v);
              setShowTooltip(false);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <ItemMenuInner item={item} isOpened={isExpanded} isSelected={isExpanded} />
          </button>
        )}
        renderElement={(ref) =>
          showTooltip &&
          !isExpanded && (
            <div
              ref={ref}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setIsExpanded(true)}
              className="floating-side-menu-wrapper"
            >
              <ul className="floating-side-menu">{childrenMenuContent}</ul>
            </div>
          )
        }
      />

      {/* Render sub actions as list */}
      <AnimateHeight height={isExpanded ? "auto" : 0} className="position-relative" duration={300}>
        <ul className="nested-side-menu">{childrenMenuContent}</ul>
      </AnimateHeight>
    </>
  );
}

export function SideMenu<T = unknown>({
  className,
  menu,
  selected,
  onSelectedChange,
}: {
  className?: string;
  menu: MenuItem<T>[];
  selected?: string;
  onSelectedChange: (item: MenuItem<T>) => void;
}) {
  return (
    <ul className={cx("side-menu", className)}>
      {menu.map((item) => (
        <li key={item.id}>
          {"children" in item ? (
            <ExpandableItem item={item} onSelectedChange={onSelectedChange} selected={selected} />
          ) : (
            <SimpleItem item={item} selected={selected} onSelectedChange={onSelectedChange} />
          )}
        </li>
      ))}
    </ul>
  );
}

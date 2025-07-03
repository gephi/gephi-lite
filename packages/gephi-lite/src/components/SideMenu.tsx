import cx from "classnames";
import { capitalize } from "lodash";
import { type FC, ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";

import { CaretDownIcon, CaretRightIcon } from "./common-icons";

type MenuCommon<T> = {
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

const ItemMenuInner: FC<{ item: MenuItem; isOpened?: boolean }> = ({ item, isOpened }) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center w-100">
      {"label" in item ? (
        <span className="side-menu-item">{item.label}</span>
      ) : (
        <>
          {item.icon && <span className="side-menu-icon">{isOpened ? <item.icon.fill /> : <item.icon.normal />}</span>}
          <span className="side-menu-item">{item.capitalize ? capitalize(t(item.i18nKey)) : t(item.i18nKey)}</span>
        </>
      )}
      {isOpened !== undefined && <span>{isOpened ? <CaretDownIcon /> : <CaretRightIcon />}</span>}
    </div>
  );
};

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsed((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  return (
    <ul className={cx("side-menu", className)}>
      {menu.map((item) => (
        <li key={item.id}>
          <button
            className={cx("gl-btn w-100 text-start", selected === item.id && "gl-btn-fill")}
            onClick={() => {
              if ("children" in item) toggleSection(item.id);
              else onSelectedChange(item);
            }}
          >
            <ItemMenuInner item={item} isOpened={"children" in item ? collapsed.has(item.id) : undefined} />
          </button>

          {/* Render sub actions as list */}
          {"children" in item && collapsed.has(item.id) && (
            <ul>
              {item.children.map((item) => (
                <li key={item.id}>
                  {item.type === "text" ? (
                    <span className={cx("gl-btnlike", item.className)}>
                      <ItemMenuInner item={item} />
                    </span>
                  ) : (
                    <button
                      className={cx("gl-btn w-100 text-start", selected === item.id && "gl-btn-fill")}
                      onClick={() => onSelectedChange(item)}
                    >
                      <ItemMenuInner item={item} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

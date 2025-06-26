import cx from "classnames";
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
      icon?: {
        normal: IconType;
        fill: IconType;
      };
    }
) &
  T;
type MenuSection<T> = MenuCommon<T> & { children: MenuCommon<T>[] };
export type MenuItem<T = unknown> = MenuCommon<T> | MenuSection<T>;

const ItemMenuInner: FC<{ item: MenuItem; isOpened?: boolean }> = ({ item, isOpened }) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center w-100">
      {"label" in item ? (
        <span className="flex-grow-1">{item.label}</span>
      ) : (
        <>
          <span>
            {item.icon && (isOpened ? <item.icon.fill className="me-1" /> : <item.icon.normal className="me-1" />)}
          </span>
          <span className="flex-grow-1">{t(item.i18nKey)}</span>
        </>
      )}
      {isOpened !== undefined && <span>{isOpened ? <CaretDownIcon /> : <CaretRightIcon />}</span>}
    </div>
  );
};

export function NavMenu<T = unknown>({
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
    <ul className={cx("nav-menu list-unstyled d-flex flex-column gl-gap-md", className)}>
      {menu.map((item) => (
        <li key={item.id}>
          <button
            className={cx("btn w-100 text-start", selected === item.id && "btn-dark")}
            onClick={() => {
              if ("children" in item) toggleSection(item.id);
              else onSelectedChange(item);
            }}
          >
            <ItemMenuInner item={item} isOpened={"children" in item ? collapsed.has(item.id) : undefined} />
          </button>

          {/* Render sub actions as list */}
          {"children" in item && collapsed.has(item.id) && (
            <ul className="list-unstyled gl-mx-md gl-gap-xs">
              {item.children.map((item) => (
                <li key={item.id} className="gl-mx-sm">
                  <button
                    className={cx("btn w-100 text-start", selected === item.id && "btn-dark")}
                    onClick={() => onSelectedChange(item)}
                  >
                    <ItemMenuInner item={item} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

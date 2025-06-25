import cx from "classnames";
import { type FC, useCallback, useState } from "react";
import { IconType } from "react-icons";

import { CaretDownIcon, CaretRightIcon } from "./common-icons";

interface MenuCommon {
  id: string;
  label: string;
  icon?: IconType;
}
type MenuAction = MenuCommon & { onClick: () => void };
type MenuSection = MenuCommon & { children: MenuAction[] };
export type MenuItem = MenuSection | MenuAction;

const ItemMenuInner: FC<{ item: MenuItem; isOpened?: boolean }> = ({ item, isOpened }) => {
  return (
    <div className="d-flex align-items-center w-100">
      <span>{item.icon && <item.icon className="me-1" />}</span>
      <span className="flex-grow-1">{item.label}</span>
      {isOpened !== undefined && <span>{isOpened ? <CaretDownIcon /> : <CaretRightIcon />}</span>}
    </div>
  );
};

interface NavMenuProps {
  className?: string;
  menu: MenuItem[];
  selected?: string;
}
export const NavMenu: FC<NavMenuProps> = ({ className, menu, selected }) => {
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
    <ul className={cx("nav-menu list-unstyled d-flex flex-column", className)}>
      {menu.map((item) => (
        <li key={item.label}>
          <button
            className={cx("btn w-100 text-start", selected === item.id && "btn-dark")}
            onClick={() => {
              if ("children" in item) toggleSection(item.id);
              if ("onClick" in item) item.onClick();
            }}
          >
            <ItemMenuInner item={item} isOpened={"children" in item ? collapsed.has(item.id) : undefined} />
          </button>

          {/* Render sub actions as list */}
          {"children" in item && collapsed.has(item.id) && (
            <ul className="list-unstyled ms-3">
              {item.children.map((action) => (
                <li key={action.label} className="ms-1">
                  <button
                    className={cx("btn w-100 text-start", selected === action.id && "btn-dark")}
                    onClick={action.onClick}
                  >
                    <ItemMenuInner item={action} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

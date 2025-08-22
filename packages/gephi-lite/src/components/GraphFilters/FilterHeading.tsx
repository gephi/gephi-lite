import classNames from "classnames";
import { FC } from "react";

import { useFilters, useFiltersActions } from "../../core/context/dataContexts";

export const FilterHeading: FC<{ label: string; filterIndex: number; active?: boolean }> = ({
  label,
  active,
  filterIndex,
}) => {
  const filters = useFilters();
  const disabled = active === true && filterIndex === filters.past.length - 1;
  const { openPastFilter, openFutureFilter } = useFiltersActions();

  return (
    <>
      <div className="filter-title text-wrap">
        <button
          type="button"
          className="gl-btn"
          disabled={disabled}
          onClick={() => {
            if (active) {
              openPastFilter(filterIndex);
            } else {
              openFutureFilter(filterIndex);
            }
          }}
        >
          {/* {disabled ? (
            <PiCircleFill
              className={classNames("filter-chain-point", active ? "gl-container-highest-bg" : "gl-container-high-bg")}
            />
          ) : (
            <PiCircleBold className="filter-chain-point" />
          )} */}
          {disabled ? (
            <div className="filter-chain-point current" />
          ) : (
            <div
              className={classNames("filter-chain-point", active ? "gl-container-highest-bg" : "gl-container-high-bg")}
            />
          )}

          {label}
        </button>
      </div>
    </>
  );
};

import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions } from "../../core/context/dataContexts";
import { FilterParameter, TopologicalFilterType } from "../../core/filters/types";
import { GraphSearch } from "../GraphSearch";
import { EnumInput, NumberInput } from "../forms/TypedInputs";
import { FilteredGraphSummary } from "./FilteredGraphSummary";

export const TopologicalFilterEditor: FC<{ filter: TopologicalFilterType<FilterParameter[]> }> = ({ filter }) => {
  const { replaceCurrentFilter } = useFiltersActions();

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="d-flex flex-column">
        {filter.parameters
          .filter((p) => !p.hidden)
          .map((p) => {
            switch (p.type) {
              case "node":
                return (
                  <div className="mt-1">
                    <label className="form-check-label small">{p.label}</label>
                    <GraphSearch
                      onChange={(option) => {
                        if (option === null || "id" in option) {
                          console.log("select from search", option?.id);
                          replaceCurrentFilter({
                            ...filter,
                            parameters: filter.parameters.map((_p) => {
                              if (_p.id === p.id) {
                                return { ...p, value: option?.id || undefined };
                              }
                              return _p;
                            }),
                          });
                        }
                      }}
                      value={p.value ? { type: "nodes", id: p.value } : null}
                      type="nodes"
                    />
                  </div>
                );
              case "number":
                return (
                  <NumberInput
                    {...p}
                    value={p.value || null}
                    onChange={(value) => {
                      replaceCurrentFilter({
                        ...filter,
                        parameters: filter.parameters.map((_p) => {
                          if (_p.id === p.id) {
                            return { ...p, value: value || undefined };
                          }
                          return _p;
                        }),
                      });
                    }}
                  />
                );
              case "enum":
                return (
                  <EnumInput
                    {...p}
                    value={p.value || p.defaultValue}
                    onChange={(value) => {
                      replaceCurrentFilter({
                        ...filter,
                        parameters: filter.parameters.map((_p) => {
                          if (_p.id === p.id) {
                            return { ...p, value: value || undefined };
                          }
                          return _p;
                        }),
                      });
                    }}
                  />
                );
            }
          })}
      </div>
    </form>
  );
};

export const TopologicalFilter: FC<{
  filter: TopologicalFilterType<FilterParameter[]>;
  filterIndex: number;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode, filterIndex, active }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="fs-5">{filter.label}</div>
      {!editMode && (
        <div className="flex-grow-1">
          <span className="fs-6">{filter.summary(filter.parameters)}</span>{" "}
        </div>
      )}
      {active && <FilteredGraphSummary filterIndex={filterIndex} />}
      {editMode && <TopologicalFilterEditor filter={filter} />}
    </>
  );
};

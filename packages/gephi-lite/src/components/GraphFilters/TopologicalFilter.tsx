import { FC, useMemo } from "react";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { buildTopologicalFiltersDefinitions } from "../../core/filters/topological";
import { FilterParameter, TopologicalFilterDefinition, TopologicalFilterType } from "../../core/filters/types";
import { GraphSearch } from "../GraphSearch";
import { EnumInput, NumberInput } from "../forms/TypedInputs";
import { FilterHeading } from "./FilterHeading";
import { FilteredGraphSummary } from "./FilteredGraphSummary";

export function TopologicalFilterEditor<ParametersType extends FilterParameter[]>({
  filterDefinition,
  filter,
}: {
  filterDefinition: TopologicalFilterDefinition<ParametersType>;
  filter: TopologicalFilterType;
}) {
  const { replaceCurrentFilter } = useFiltersActions();
  const { parameters } = filter;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="filter-settings">
      <div className="d-flex flex-column">
        {filterDefinition.parameters
          .filter((p) => !p.hidden)
          .map((p, i) => {
            switch (p.type) {
              case "node":
                return (
                  <div key={i} className="mt-1">
                    <label className="form-check-label small">{p.label}</label>
                    <GraphSearch
                      className="form-control-sm"
                      onChange={(option) => {
                        if (option === null || "id" in option) {
                          replaceCurrentFilter({
                            ...filter,
                            parameters: parameters.map((v: unknown, j: number) =>
                              i === j ? option?.id || undefined : v,
                            ),
                          });
                        }
                      }}
                      value={typeof parameters[i] === "string" ? { type: "nodes", id: parameters[i] } : null}
                      type="nodes"
                    />
                  </div>
                );
              case "number":
                return (
                  <NumberInput
                    {...p}
                    key={i}
                    value={parameters[i] as number}
                    onChange={(value) => {
                      replaceCurrentFilter({
                        ...filter,
                        parameters: parameters.map((v: unknown, j: number) => (i === j ? value : v)),
                      });
                    }}
                  />
                );
              case "enum":
                return (
                  <EnumInput
                    {...p}
                    key={i}
                    value={parameters[i] as string}
                    onChange={(value) => {
                      replaceCurrentFilter({
                        ...filter,
                        parameters: parameters.map((v: unknown, j: number) => (i === j ? value : v)),
                      });
                    }}
                  />
                );
            }
          })}
      </div>
    </form>
  );
}

export const TopologicalFilter: FC<{
  filter: TopologicalFilterType;
  filterIndex: number;
  active?: boolean;
  editMode?: boolean;
}> = ({ filter, editMode, filterIndex, active }) => {
  const {
    metadata: { type: graphType },
  } = useGraphDataset();
  const filterDefinition = useMemo(
    () =>
      buildTopologicalFiltersDefinitions(graphType !== "undirected").find((f) => f.id === filter.topologicalFilterId),
    [filter.topologicalFilterId, graphType],
  );

  return filterDefinition ? (
    <>
      <FilterHeading label={filterDefinition.label} active={active} filterIndex={filterIndex} />
      {!editMode && <div className="filter-settings-summary">{filterDefinition.summary(filter.parameters)}</div>}
      {active && <FilteredGraphSummary filterIndex={filterIndex} />}
      {editMode && <TopologicalFilterEditor filter={filter} filterDefinition={filterDefinition} />}
    </>
  ) : null;
};

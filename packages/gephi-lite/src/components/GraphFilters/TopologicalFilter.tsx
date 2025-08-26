import { FC, useMemo } from "react";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { buildTopologicalFiltersDefinitions } from "../../core/filters/topological";
import { FilterParameter, TopologicalFilterDefinition, TopologicalFilterType } from "../../core/filters/types";
import { GraphSearch } from "../GraphSearch";
import { EnumInput, NumberInput } from "../forms/TypedInputs";

export function TopologicalFilterEditor<ParametersType extends FilterParameter[]>({
  filterDefinition,
  filter,
  filterIndex,
}: {
  filterDefinition: TopologicalFilterDefinition<ParametersType>;
  filter: TopologicalFilterType;
  filterIndex: number;
}) {
  const { updateFilter } = useFiltersActions();
  const { parameters } = filter;

  return (
    <form onSubmit={(e) => e.preventDefault()}>
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
                          updateFilter(filterIndex, {
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
                      updateFilter(filterIndex, {
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
                      updateFilter(filterIndex, {
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
}> = ({ filter, filterIndex }) => {
  const {
    metadata: { type: graphType },
  } = useGraphDataset();
  const filterDefinition = useMemo(
    () =>
      buildTopologicalFiltersDefinitions(graphType !== "undirected").find((f) => f.id === filter.topologicalFilterId),
    [filter.topologicalFilterId, graphType],
  );

  return filterDefinition ? (
    <TopologicalFilterEditor filter={filter} filterDefinition={filterDefinition} filterIndex={filterIndex} />
  ) : null;
};

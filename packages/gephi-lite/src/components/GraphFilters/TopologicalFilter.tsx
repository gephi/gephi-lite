import { omit } from "lodash";
import { FC, useMemo } from "react";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { buildTopologicalFiltersDefinitions } from "../../core/filters/topological";
import { FilterParameter, TopologicalFilterDefinition, TopologicalFilterType } from "../../core/filters/types";
import { GraphSearch } from "../GraphSearch";
import { BooleanInput, EnumInput, NumberInput } from "../forms/TypedInputs";

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
      <div className="d-flex flex-column gl-gap-2">
        {filterDefinition.parameters
          .filter((p) => !p.hidden)
          .map((p, i) => {
            switch (p.type) {
              case "node":
                return (
                  <div key={i}>
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
                  <div key={i}>
                    <NumberInput
                      {...p}
                      value={parameters[i] as number}
                      onChange={(value) => {
                        updateFilter(filterIndex, {
                          ...filter,
                          parameters: parameters.map((v: unknown, j: number) => (i === j ? value : v)),
                        });
                      }}
                    />
                  </div>
                );
              case "enum":
                return (
                  <div key={i}>
                    <EnumInput
                      {...p}
                      value={parameters[i] as string}
                      onChange={(value) => {
                        updateFilter(filterIndex, {
                          ...filter,
                          parameters: parameters.map((v: unknown, j: number) => (i === j ? value : v)),
                        });
                      }}
                    />
                  </div>
                );
              case "boolean":
                return (
                  <div key={i}>
                    <BooleanInput
                      {...omit(p, "defaultValue")}
                      key={i}
                      value={(parameters[i] as boolean) || p.defaultValue}
                      onChange={(value) => {
                        updateFilter(filterIndex, {
                          ...filter,
                          parameters: parameters.map((v: unknown, j: number) => (i === j ? value : v)),
                        });
                      }}
                    />
                  </div>
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
  const { fullGraph } = useGraphDataset();
  const filterDefinition = useMemo(
    () => buildTopologicalFiltersDefinitions(fullGraph).find((f) => f.id === filter.topologicalFilterId),
    [filter.topologicalFilterId, fullGraph],
  );

  return filterDefinition ? (
    <TopologicalFilterEditor filter={filter} filterDefinition={filterDefinition} filterIndex={filterIndex} />
  ) : null;
};

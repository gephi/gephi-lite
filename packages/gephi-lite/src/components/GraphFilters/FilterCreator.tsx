import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CgAddR } from "react-icons/cg";
import Select from "react-select";

import { useFilters, useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { topologicalFilters } from "../../core/filters/topological";
import { FilterType } from "../../core/filters/types";
import { FieldModel } from "../../core/graph/types";
import { ItemType } from "../../core/types";
import { DEFAULT_SELECT_PROPS } from "../consts";

export interface FilterOption {
  value: string;
  label: string | JSX.Element;
  disabled?: boolean;
  field?: string;
  type: string;
}

export const FilterCreator: FC = () => {
  const { nodeFields, edgeFields, metadata } = useGraphDataset();
  const { t } = useTranslation();
  const { addFilter } = useFiltersActions();
  const filters = useFilters();

  const [isOpened, setIsOpened] = useState(false);
  const [filterApplicationType, setFilterApplicationType] = useState<ItemType | "topological">("nodes");
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [selectedFilterOption, setSelectedFilterOption] = useState<FilterOption | null>(null);
  const [filterCreation, setFilterCreation] = useState<FilterType | null>(null);

  useEffect(() => {
    setIsOpened(false);
  }, [filters]);

  useEffect(() => {
    setSelectedFilterOption(null);
    setFilterCreation(null);
    if (filterApplicationType === "topological") {
      const topologicalFiltersOptions: FilterOption[] = topologicalFilters(metadata.type !== "undirected").map(
        (tf) => ({
          value: tf.id,
          label: tf.label,
          type: "topological",
        }),
      );
      setFilterOptions(topologicalFiltersOptions);
    } else {
      // Fields filters
      const allFields: FieldModel[] = filterApplicationType === "nodes" ? nodeFields : edgeFields;
      const fieldFiltersOptions: FilterOption[] = allFields.flatMap((field) => {
        const options = [];
        if (field.quantitative)
          options.push({
            value: `range::${field.id}`,
            label: (
              <>
                {field.id} <span className="text-muted">({t("filters.range")})</span>
              </>
            ),
            type: "range",
            field: field.id,
          });
        if (!!field.qualitative)
          options.push({
            value: `term::${field.id}`,
            label: (
              <>
                {field.id} <span className="text-muted">({t("filters.terms")})</span>
              </>
            ),
            type: "terms",
            field: field.id,
          });
        return options;
      });

      const scriptFilterOption: FilterOption = {
        value: "script",
        label: t("filters.script") as string,
        type: "script",
      };
      setFilterOptions([...fieldFiltersOptions, scriptFilterOption]);
    }
  }, [filterApplicationType, edgeFields, nodeFields, t, metadata.type]);

  if (!isOpened) {
    return (
      <div className="filter-item d-flex align-items-center justify-content-center">
        <button type="button" className="btn btn-outline-dark border-0" onClick={() => setIsOpened(true)}>
          <CgAddR /> {t("filters.add_filter")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (filterCreation !== null) {
          addFilter(filterCreation);
          setSelectedFilterOption(null);
          setFilterCreation(null);
        }
      }}
      className="d-flex align-items-center filter-item"
    >
      <div className="d-flex flex-column p-3 w-100">
        <div>
          {t("filters.filter")}{" "}
          <Select
            {...DEFAULT_SELECT_PROPS}
            onChange={(o) => setFilterApplicationType(o?.value as ItemType | "topological")}
            options={[
              { label: capitalize(t("graph.model.nodes").toString()), value: "nodes" },
              { label: capitalize(t("graph.model.edges").toString()), value: "edges" },
              { label: t("filters.topological").toString(), value: "topological" },
            ]}
          />
        </div>
        <div className="mt-1">
          {t("filters.using")}
          {filterOptions.length > 0 && (
            <Select
              {...DEFAULT_SELECT_PROPS}
              value={selectedFilterOption}
              isClearable={true}
              onChange={(selectedOption) => {
                setSelectedFilterOption(selectedOption);
                if (!selectedOption) setFilterCreation(null);
                else {
                  switch (filterApplicationType) {
                    case "nodes":
                    case "edges": {
                      if (selectedOption.type !== "script" && selectedOption.field)
                        setFilterCreation({
                          itemType: filterApplicationType as ItemType,
                          type: selectedOption.type as "terms" | "range",
                          field: selectedOption.field,
                        });
                      else setFilterCreation({ itemType: filterApplicationType, type: "script" });
                      break;
                    }
                    case "topological":
                      setFilterCreation(
                        topologicalFilters(metadata.type !== "undirected").find((f) => f.id === selectedOption.value) ||
                          null,
                      );
                  }
                }
              }}
              options={filterOptions}
              isOptionDisabled={(option) => !!option.disabled}
            />
          )}
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-outline-dark me-2" onClick={() => setIsOpened(false)}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn btn-dark" disabled={filterCreation === null}>
            {t("filters.create_filter")}
          </button>
        </div>
      </div>
    </form>
  );
};

import { ItemDataField } from "@gephi/gephi-lite-sdk";
import { capitalize } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CgAddR } from "react-icons/cg";
import Select from "react-select";

import { useDynamicItemData, useFilters, useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { buildTopologicalFiltersDefinitions } from "../../core/filters/topological";
import { FilterType } from "../../core/filters/types";
import { staticDynamicAttributeKey, staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { FieldModel } from "../../core/graph/types";
import { ItemType } from "../../core/types";
import { DEFAULT_SELECT_PROPS } from "../consts";

export interface FilterOption {
  value: string;
  label: string | JSX.Element;
  disabled?: boolean;
  field?: ItemDataField;
  type: string;
}

export const FilterCreator: FC = () => {
  const { nodeFields, edgeFields, metadata } = useGraphDataset();
  const { dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const { t } = useTranslation();
  const { addFilter } = useFiltersActions();
  const filters = useFilters();
  const topologicalFiltersDefinitions = useMemo(
    () => buildTopologicalFiltersDefinitions(metadata.type !== "undirected"),
    [metadata],
  );

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
      const topologicalFiltersOptions: FilterOption[] = topologicalFiltersDefinitions.map((tf) => ({
        value: tf.id,
        label: tf.label,
        type: "topological",
      }));
      setFilterOptions(topologicalFiltersOptions);
    } else {
      // Fields filters
      const allFields: FieldModel<ItemType, boolean>[] =
        filterApplicationType === "nodes"
          ? [...nodeFields, ...dynamicNodeFields]
          : [...edgeFields, ...dynamicEdgeFields];
      const fieldFiltersOptions: FilterOption[] = allFields.flatMap((field) => {
        const options = [];
        const staticDynamicField = { field: field.id, dynamic: field.dynamic };
        if (field.quantitative)
          options.push({
            value: `range::${staticDynamicAttributeKey(staticDynamicField)}`,
            label: (
              <>
                {staticDynamicAttributeLabel(staticDynamicField)}{" "}
                <span className="text-muted">({t("filters.range")})</span>
              </>
            ),
            type: "range",
            field: staticDynamicField,
          });
        if (!!field.qualitative)
          options.push({
            value: `term::${field.id}`,
            label: (
              <>
                {staticDynamicAttributeLabel(staticDynamicField)}{" "}
                <span className="text-muted">({t("filters.terms")})</span>
              </>
            ),
            type: "terms",
            field: staticDynamicField,
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
  }, [
    filterApplicationType,
    edgeFields,
    nodeFields,
    t,
    topologicalFiltersDefinitions,
    dynamicEdgeFields,
    dynamicNodeFields,
  ]);

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
                    case "topological": {
                      const filterDefinition = topologicalFiltersDefinitions.find((f) => f.id === selectedOption.value);
                      setFilterCreation(
                        filterDefinition
                          ? {
                              type: "topological",
                              topologicalFilterId: filterDefinition.id,
                              parameters: filterDefinition.parameters.map((param) => param.defaultValue),
                            }
                          : null,
                      );
                    }
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

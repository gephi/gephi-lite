import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CgAddR } from "react-icons/cg";

import {
  useDynamicItemData,
  useFilters,
  useFiltersActions,
  useGraphDataset,
  useTopologicalFilters,
} from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { staticDynamicAttributeKey, staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { FieldModel } from "../../core/graph/types";
import { ItemType } from "../../core/types";
import { FieldModelIcons } from "../common-icons";
import { Select } from "../forms/Select";

export interface FilterOption {
  value: string;
  label: string | JSX.Element;
  disabled?: boolean;
  field?: FieldModel;
  type: "terms" | "range" | "script" | "unsupported" | "topological";
}

export const FilterCreator: FC = () => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const { t } = useTranslation();
  const { addFilter } = useFiltersActions();
  const filters = useFilters();
  const topologicalFiltersDefinitions = useTopologicalFilters();

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
      const fieldFiltersOptions: FilterOption[] = allFields
        .filter((field): field is FieldModel => field.type !== "text")
        .map((field): FilterOption => {
          const Icon = FieldModelIcons[field.type];
          switch (field.type) {
            case "number":
            case "date":
              return {
                value: `range::${staticDynamicAttributeKey(field)}`,
                label: (
                  <>
                    <Icon className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
                type: "range",
                field,
              };
            //default to please TS
            case "category":
            case "keywords":
            default:
              return {
                value: `term::${field.id}`,
                label: (
                  <>
                    <Icon className="me-1" />
                    {staticDynamicAttributeLabel(field)}
                  </>
                ),
                type: "terms",
                field: field,
              };
          }
        });
      //TODO: allow filter on text attribute with a new search filter
      const unsupportedFieldFilters = allFields
        .filter((field): field is FieldModel => field.type !== "text")
        .map((field): FilterOption => {
          const Icon = FieldModelIcons[field.type];
          return {
            value: `unsupported::${field.id}`,
            label: (
              <>
                <Icon className="me-1" />
                {staticDynamicAttributeLabel(field)}
              </>
            ),
            type: "terms",
            field,
          };
        });

      const scriptFilterOption: FilterOption = {
        value: "script",
        label: t("filters.script"),
        type: "script",
      };
      setFilterOptions([...fieldFiltersOptions, scriptFilterOption, ...unsupportedFieldFilters]);
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
        <button type="button" className="gl-btn" onClick={() => setIsOpened(true)}>
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
        <div className="d-flex justify-content-end gl-py-md gl-gap-sm">
          <button type="button" className="gl-btn gl-btn-outline" onClick={() => setIsOpened(false)}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="gl-btn gl-btn-fill" disabled={filterCreation === null}>
            {t("filters.create_filter")}
          </button>
        </div>
      </div>
    </form>
  );
};

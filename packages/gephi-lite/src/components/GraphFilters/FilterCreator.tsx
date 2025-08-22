import classNames from "classnames";
import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { FieldModelIcons, FilterAddIcon } from "../common-icons";
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
        .filter((field): field is FieldModel => field.type === "text")
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
            disabled: true,
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
      <div className="filter-item">
        <div className=" gl-px-3">
          <button type="button" className="filter-creator gl-btn position-relative" onClick={() => setIsOpened(true)}>
            <div className="filter-chain-point">
              <FilterAddIcon />
            </div>{" "}
            {t("filters.add_filter")}
          </button>
        </div>
        <div className={classNames("filter-chain", filters.future.length === 0 && "last-step")} />
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
      className="d-flex align-items-center filter-item gl-px-3"
    >
      <div className="d-flex flex-column gl-gap-2 w-100">
        <div className="d-flex flex-column gl-gap-1">
          <div>{t("filters.filter")}</div>
          <Select
            onChange={(o) => setFilterApplicationType(o?.value as ItemType | "topological")}
            options={[
              { label: capitalize(t("graph.model.nodes").toString()), value: "nodes" },
              { label: capitalize(t("graph.model.edges").toString()), value: "edges" },
              { label: t("filters.topological").toString(), value: "topological" },
            ]}
          />
        </div>
        <div className="d-flex flex-column gl-gap-1">
          <div>{t("filters.using")}</div>
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
        <div className="d-flex gl-gap-2">
          <button type="button" className="gl-btn gl-btn-outline flex-grow-1" onClick={() => setIsOpened(false)}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="gl-btn gl-btn-fill flex-grow-1" disabled={filterCreation === null}>
            {t("filters.create_filter")}
          </button>
        </div>
      </div>
    </form>
  );
};

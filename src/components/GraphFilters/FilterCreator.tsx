import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CgAddR } from "react-icons/cg";
import Select from "react-select";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { FieldModel } from "../../core/graph/types";
import { ItemType } from "../../core/types";

interface FilterOption {
  value: string;
  label: string | JSX.Element;
  disabled?: boolean;
  field?: string;
  type: string;
}

export const FilterCreator: FC = () => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const { t } = useTranslation();
  const { addFilter } = useFiltersActions();

  const [filterApplicationType, setFilterApplicationType] = useState<ItemType | "topological">("nodes");
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [selectedFilterOption, setSelectedFilterOption] = useState<FilterOption | null>(null);
  const [filterCreation, setFilterCreation] = useState<FilterType | null>(null);

  useEffect(() => {
    setSelectedFilterOption(null);
    setFilterCreation(null);
    if (filterApplicationType === "topological") {
      // TODO: topological filters
      const topologicalFiltersOptions: FilterOption[] = [
        { value: "degree", label: "Topological on Degree (TODO)", disabled: true, type: "topological" },
        {
          value: "main_connected_component",
          label: "Main connected component (TODO)",
          disabled: true,
          type: "topological",
        },
      ];
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
  }, [filterApplicationType, edgeFields, nodeFields, t]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (filterCreation !== null) {
          addFilter(filterCreation);
        }
      }}
      className="d-flex align-items-center "
    >
      <div className="d-flex flex-column ms-2 w-100">
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
                    case "topological":
                      setFilterCreation({ type: "topological", method: selectedOption.value });
                  }
                }
              }}
              options={filterOptions}
              isOptionDisabled={(option) => !!option.disabled}
            />
          )}
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="submit" className="btn btn-primary" disabled={filterCreation === null}>
            <CgAddR /> {t("common.add")} {t("filters.filter")}
          </button>
        </div>
      </div>
    </form>
  );
};

import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { FilterType } from "../../core/filters/types";
import { FieldModel } from "../../core/graph/types";
import { ItemType } from "../../core/types";

interface FilterOption {
  id: string;
  label: string;
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
  const [filterCreation, setFilterCreation] = useState<FilterType | null>(null);

  useEffect(() => {
    if (filterApplicationType === "topological") {
      // TODO: topological filters
      const topologicalFiltersOptions: FilterOption[] = [
        { id: "topological::degree", label: "Topological on Degree (TODO)", disabled: true, type: "topological" },
        {
          id: "topological::main_connected_component",
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
            id: `range::${field.id}`,
            label: `${field.id} (range)`,
            type: "range",
            field: field.id,
          });
        if (!!field.qualitative)
          options.push({
            id: `term::${field.id}`,
            label: `${field.id} (term)`,
            type: "terms",
            field: field.id,
          });
        return options;
      });

      const scriptFilterOption: FilterOption = { id: "script", label: t("filters.custom_script"), type: "script" };
      setFilterOptions([...fieldFiltersOptions, scriptFilterOption]);
    }
  }, [filterApplicationType, edgeFields, nodeFields, t]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (filterCreation !== null) addFilter(filterCreation);
      }}
    >
      {t("filters.filter_graph_on")}
      <select onChange={(o) => setFilterApplicationType(o.currentTarget.value as ItemType | "topological")}>
        <option value="nodes" selected={filterApplicationType === "nodes"}>
          {t("graph.model.nodes")}
        </option>
        <option value="edges" selected={filterApplicationType === "edges"}>
          {t("graph.model.edges")}
        </option>
        <option value="topological" selected={filterApplicationType === "topological"}>
          {t("filters.topological")}
        </option>
      </select>
      {filterOptions.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value === "") setFilterCreation(null);
            else {
              const dataset = e.target.options[e.target.selectedIndex].dataset;
              switch (filterApplicationType) {
                case "nodes":
                case "edges": {
                  if (dataset.type !== "script" && dataset.field)
                    setFilterCreation({
                      itemType: filterApplicationType as ItemType,
                      type: dataset.type as "terms" | "range",
                      field: dataset.field,
                    });
                  else setFilterCreation({ itemType: filterApplicationType, type: "script" });
                  break;
                }
                case "topological":
                  setFilterCreation({ type: "topological", method: e.target.value });
              }
            }
          }}
        >
          <option value=""></option>
          {filterOptions.map((o) => (
            <option key={o.id} value={o.id} disabled={!!o.disabled} data-type={o.type} data-field={o.field}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="btn btn-primay" disabled={filterCreation === null}>
        Add
      </button>
    </form>
  );
};

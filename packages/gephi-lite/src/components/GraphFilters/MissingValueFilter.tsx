import { FieldModel, MissingValueFilterType } from "@gephi/gephi-lite-sdk";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFiltersActions, useGraphDataset } from "../../core/context/dataContexts";
import { EnumInput } from "../forms/TypedInputs";

export const MissingValueFilter: FC<{ filter: MissingValueFilterType; filterIndex: number }> = ({
  filter,
  filterIndex,
}) => {
  //const parentGraph = useFilteredGraphAt(filterIndex - 1);
  const { nodeFields, edgeFields } = useGraphDataset();

  const { t } = useTranslation();
  const { updateFilter } = useFiltersActions();

  const fields = useMemo(
    () => (filter.itemType === "nodes" ? nodeFields : edgeFields),
    [filter.itemType, nodeFields, edgeFields],
  );

  return (
    <div className="w-100">
      <EnumInput
        id="missingValueField"
        label={t(`filters.${filter.itemType}_fields`)}
        required
        placeholder={t("common.none")}
        value={filter.field?.id || null}
        onChange={(v) =>
          updateFilter(filterIndex, { ...filter, field: v !== null ? fields.find((f) => f.id === v) : undefined })
        }
        options={((filter.itemType === "nodes" ? nodeFields : edgeFields) as FieldModel[])
          //.filter((field) => (param.restriction ? param.restriction.includes(field.type) : true))
          .map((field) => ({
            value: field.label || field.id,
            label: field.id,
          }))}
      />
    </div>
  );
};

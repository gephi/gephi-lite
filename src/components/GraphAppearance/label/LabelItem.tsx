import { FC, useMemo } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";

import { ItemType } from "../../../core/types";
import { useAppearance, useAppearanceActions, useGraphDataset } from "../../../core/context/dataContexts";
import { FieldModel } from "../../../core/graph/types";

type LabelOption =
  | { value: string; type: "none" | "data" | "fixed"; field?: undefined; label: string }
  | { value: string; type: "field"; field: string; label: string };

export const LabelItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { nodesLabel, edgesLabel } = useAppearance();
  const { setLabelAppearance } = useAppearanceActions();

  const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
  const labelsDef = itemType === "nodes" ? nodesLabel : edgesLabel;
  const labelOptions = useMemo(() => {
    return [
      ...allFields.map((field) => ({
        value: `field::${field.id}`,
        type: "field",
        field: field.id,
        label: field.id,
      })),
      { value: "fixed", type: "fixed", label: "Fixed label" },
      { value: "data", type: "data", label: "As they appear in the original data" },
      { value: "none", type: "none", label: "None" },
    ] as LabelOption[];
  }, [allFields]);
  const selectedLabelOption: LabelOption | null = useMemo(
    () => labelOptions.find((option) => option.type === labelsDef.type && option.field === labelsDef.field) || null,
    [labelOptions, labelsDef.field, labelsDef.type],
  );

  return (
    <>
      <h3 className="fs-5 mt-3">{t("appearance.labels.title")}</h3>
      <Select<LabelOption>
        options={labelOptions}
        value={selectedLabelOption}
        onChange={(option) => {
          if (!option) {
            setLabelAppearance(itemType, {
              type: "none",
            });
          } else if (option.type === "field") {
            setLabelAppearance(itemType, {
              type: "field",
              field: option.field,
              missingLabel: null,
            });
          } else if (option.type === "fixed") {
            setLabelAppearance(itemType, {
              type: "fixed",
              value: "label",
            });
          } else {
            setLabelAppearance(itemType, {
              type: option.type,
            });
          }
        }}
      />
    </>
  );
};

import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { isEqual } from "lodash";

import { SizeRankingEditor } from "./SizeRankingEditor";
import { SizeFixedEditor } from "./SizeFixedEditor";
import { ItemType } from "../../../core/types";
import { FieldModel } from "../../../core/graph/types";
import { DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE } from "../../../core/appearance/utils";
import { useAppearance, useAppearanceActions, useGraphDataset } from "../../../core/context/dataContexts";
import { Size } from "../../../core/appearance/types";

type SizeOption = { value: string; label: string | JSX.Element; field?: string; type: string };

export const SizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const appearance = useAppearance();
  const { setSizeAppearance } = useAppearanceActions();

  const baseValue = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
  const size = itemType === "nodes" ? appearance.nodesSize : appearance.edgesSize;

  const options: SizeOption[] = useMemo(() => {
    const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
    return [
      { value: "data", type: "data", label: t("appearance.size.data") as string },
      { value: "fixed", type: "fixed", label: t("appearance.size.fixed") as string },
      ...allFields.flatMap((field) => {
        const options = [];
        if (!!field.quantitative)
          options.push({
            value: `ranking::${field.id}`,
            field: field.id,
            type: "ranking",
            label: field.id,
          });
        return options;
      }),
    ];
  }, [edgeFields, itemType, nodeFields, t]);

  const selectedOption =
    options.find((option) => option.type === size.type && option.field === size.field) || options[0];

  return (
    <>
      <h3 className="fs-5 mt-3">{t("appearance.size.title")}</h3>
      <label htmlFor={`${itemType}-sizeMode`}>{t("appearance.size.set_size_from")}</label>
      <Select<SizeOption>
        id={`${itemType}-sizeMode`}
        options={options}
        value={selectedOption}
        onChange={(option) => {
          if (isEqual(selectedOption, option)) return;

          if (!option || option.value === "fixed") {
            if (size.type !== "fixed") {
              setSizeAppearance(itemType, {
                type: "fixed",
                value: baseValue,
              });
            }
          } else if (!option.field) {
            setSizeAppearance(itemType, {
              type: option.type, // this is here to trick TS for nodes
            } as Size);
          } else if (option.type === "ranking") {
            setSizeAppearance(itemType, {
              type: "ranking",
              field: option.field,
              minSize: baseValue / 2,
              maxSize: baseValue * 2,
              missingSize: baseValue / 3,
            });
          }
        }}
      />

      {size.type === "data" && (
        <p className="fst-italic text-muted small mt-1">
          {t("appearance.size.data_description", { items: t(`graph.model.${itemType}`) })}
        </p>
      )}
      {size.type === "fixed" && (
        <SizeFixedEditor itemType={itemType} size={size} setSize={(newSize) => setSizeAppearance(itemType, newSize)} />
      )}
      {size.type === "ranking" && (
        <SizeRankingEditor
          itemType={itemType}
          size={size}
          setSize={(newSize) => setSizeAppearance(itemType, newSize)}
        />
      )}
    </>
  );
};

import { isEqual } from "lodash";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Size } from "../../../core/appearance/types";
import { DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE } from "../../../core/appearance/utils";
import {
  useAppearance,
  useAppearanceActions,
  useDynamicItemData,
  useGraphDataset,
} from "../../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../../core/graph/dynamicAttributes";
import { FieldModel } from "../../../core/graph/types";
import { ItemType } from "../../../core/types";
import { FieldModelIcons } from "../../common-icons";
import { Select } from "../../forms/Select";
import { SizeFixedEditor } from "./SizeFixedEditor";
import { SizeRankingEditor } from "./SizeRankingEditor";

type SizeOption = { value: string; label: string | JSX.Element; field?: FieldModel<ItemType, boolean>; type: string };

export const SizeItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const appearance = useAppearance();
  const { setSizeAppearance } = useAppearanceActions();

  const baseValue = itemType === "nodes" ? DEFAULT_NODE_SIZE : DEFAULT_EDGE_SIZE;
  const size = itemType === "nodes" ? appearance.nodesSize : appearance.edgesSize;

  const options: SizeOption[] = useMemo(() => {
    const allFields: FieldModel<ItemType, boolean>[] =
      itemType === "nodes" ? [...nodeFields, ...dynamicNodeFields] : [...edgeFields, ...dynamicEdgeFields];
    return [
      // TODO: replace type data once we switched technical attribute as normal ones
      {
        value: "data",
        type: "data",
        label: (
          <>
            {t("appearance.size.data")} <small className="text-muted">{t("appearance.no_caption")}</small>
          </>
        ),
      },
      {
        value: "fixed",
        type: "fixed",
        label: t("appearance.size.fixed"),
      },
      ...allFields.flatMap((field) => {
        const options: SizeOption[] = [];
        if (field.type === "number") {
          const Icon = FieldModelIcons[field.type];
          options.push({
            value: `ranking::${staticDynamicAttributeLabel(field)}`,
            field,
            type: "ranking",
            label: (
              <>
                <Icon className="me-1" />
                {staticDynamicAttributeLabel(field)}
              </>
            ),
          });
        }
        return options;
      }),
    ];
  }, [edgeFields, itemType, nodeFields, dynamicNodeFields, dynamicEdgeFields, t]);

  const selectedOption =
    options.find((option) => {
      if (!size.field) {
        return size.type === option.type;
      }
      return option.type === size.type && option.field && size.field && option.field.id === size.field.id;
    }) || options[0];

  return (
    <div className="panel-block">
      <h3 className="fs-5">{t("appearance.size.title")}</h3>
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
        <p className="form-text small text-muted">
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
    </div>
  );
};

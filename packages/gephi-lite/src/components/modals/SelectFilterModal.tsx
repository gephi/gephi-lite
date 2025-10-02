import { FieldModel, FieldModelType, FilterType } from "@gephi/gephi-lite-sdk";
import { capitalize, sortBy } from "lodash";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useDynamicItemData,
  useFiltersActions,
  useGraphDataset,
  useTopologicalFilters,
} from "../../core/context/dataContexts";
import { staticDynamicAttributeLabel } from "../../core/graph/dynamicAttributes";
import { ModalProps } from "../../core/modals/types";
import { FieldModelIcons, ItemTypeIcon, MissingValueFilterIcon } from "../common-icons";
import { Modal } from "../modals";

const FILTER_TYPES_PER_FIELD_TYPES: Record<FieldModelType, "range" | "terms" | null> = {
  date: "range",
  number: "range",
  keywords: "terms",
  category: "terms",
  boolean: null,
  color: null,
  text: null,
  url: null,
};

const SelectFilterModal: FC<
  ModalProps<{
    filterIndex?: number;
  }>
> = ({ cancel, submit, arguments: { filterIndex } }) => {
  const { t } = useTranslation();
  const { addFilter } = useFiltersActions();
  const { nodeFields, edgeFields } = useGraphDataset();
  const { dynamicNodeFields, dynamicEdgeFields } = useDynamicItemData();
  const topologicalFiltersDefinitions = useTopologicalFilters();

  const createNewFilter = useCallback(
    (filter: FilterType) => {
      addFilter(filter, filterIndex);
      submit({});
    },
    [addFilter, filterIndex, submit],
  );

  return (
    <Modal title={t("filters.add_filter")} onClose={() => cancel()} className="modal-lg">
      <>
        <p>{t("filters.create.what_kind")}</p>

        <section className="mb-4">
          <h2>{t("filters.topological")}</h2>
          <p className="text-muted">{t("filters.create.topological_description")}</p>
          <div className="d-flex flex-wrap gap-3">
            {topologicalFiltersDefinitions.map((def) => (
              <button
                key={def.id}
                className="gl-btn gl-btn-outline"
                onClick={() => {
                  createNewFilter({
                    type: "topological",
                    topologicalFilterId: def.id,
                    parameters: def.parameters.map((param) => param.defaultValue),
                  });
                }}
              >
                {def.label}
              </button>
            ))}
          </div>
        </section>

        {[
          {
            type: "nodes" as const,
            fields: [...nodeFields, ...dynamicNodeFields],
          },
          { type: "edges" as const, fields: [...edgeFields, ...dynamicEdgeFields] },
        ].map(({ type, fields }) => {
          const fieldsList = (
            sortBy(fields, (field: FieldModel) => (FILTER_TYPES_PER_FIELD_TYPES[field.type] ? 0 : 1)) as FieldModel[]
          ).filter((field): field is FieldModel => field.type !== "text");

          return (
            <section key={type} className="mb-4">
              <h2>{t(`filters.${type}_fields`)}</h2>
              <p className="text-muted">{t(`filters.create.${type}_attributes_description`)}</p>
              <div className="d-flex flex-wrap gap-3">
                {fieldsList.length ? (
                  [
                    fieldsList.map((field) => {
                      const Icon = FieldModelIcons[field.type];
                      const filterType = FILTER_TYPES_PER_FIELD_TYPES[field.type];

                      return (
                        <button
                          key={field.id}
                          className="gl-btn gl-btn-outline"
                          disabled={!filterType}
                          onClick={() => {
                            if (filterType)
                              createNewFilter({
                                itemType: type,
                                type: filterType,
                                field,
                                keepMissingValues: true,
                              });
                          }}
                        >
                          <Icon className="me-1" />
                          {staticDynamicAttributeLabel(field)}
                        </button>
                      );
                    }),
                    // empty value filter
                    <button
                      key="missingValue"
                      className="gl-btn gl-btn-outline"
                      onClick={() => {
                        createNewFilter({
                          itemType: type,
                          type: "missingValue",
                        });
                      }}
                    >
                      <MissingValueFilterIcon className="me-1" />
                      {t("filters.missingValues")}
                    </button>,
                  ]
                ) : (
                  <span className="text-muted fst-italic">{t(`filters.create.no_${type}_attributes`)}</span>
                )}
              </div>
            </section>
          );
        })}

        <section className="mb-4">
          <h2>{t("filters.custom_script")}</h2>
          <p className="text-muted">{t("filters.create.custom_script_description")}</p>
          <div className="d-flex flex-wrap gap-3">
            {[{ type: "nodes" as const }, { type: "edges" as const }].map(({ type }) => (
              <button
                key={type}
                className="gl-btn gl-btn-outline"
                onClick={() => {
                  createNewFilter({
                    type: "script",
                    itemType: type,
                  });
                }}
              >
                <ItemTypeIcon type={type} className="me-2" /> {capitalize(t(`graph.model.${type}`))}
              </button>
            ))}
          </div>
        </section>
      </>

      <div className="gl-gap-2 d-flex">
        <button type="reset" className="gl-btn gl-btn-outline" onClick={() => cancel()}>
          {t("common.cancel")}
        </button>
      </div>
    </Modal>
  );
};

export default SelectFilterModal;

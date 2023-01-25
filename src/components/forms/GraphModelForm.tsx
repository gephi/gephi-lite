import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Tabs } from "../Tabs";
import { FieldModel } from "../../core/graph/types";
import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";

const FieldModelsComponent: FC<{ fields: FieldModel[] }> = ({ fields }) => {
  const { setFieldModel } = useGraphDatasetActions();
  const { t } = useTranslation();

  return (
    <div>
      {fields.map((field) => (
        <div key={field.id}>
          {field.id}
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${field.id}-quali`}
              checked={!!field.qualitative}
              onChange={(e) =>
                setFieldModel({
                  ...field,
                  qualitative: e.target.checked ? {} : null,
                })
              }
            />
            <label className="form-check-label" htmlFor={`${field.id}-quali`}>
              {t("graph.model.attribute.qualitative")}
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${field.id}-quanti`}
              checked={!!field.quantitative}
              onChange={(e) =>
                setFieldModel({
                  ...field,
                  quantitative: e.target.checked ? {} : null,
                })
              }
            />
            <label className="form-check-label" htmlFor={`${field.id}-quanti`}>
              {t("graph.model.attribute.quantitative")}
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export const GraphModelForm: FC = () => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const { t } = useTranslation();
  return (
    <Tabs>
      <>{t("graph.model.nodes")}</>
      <FieldModelsComponent fields={nodeFields} />
      <>{t("graph.model.edges")}</>
      <FieldModelsComponent fields={edgeFields} />
    </Tabs>
  );
};

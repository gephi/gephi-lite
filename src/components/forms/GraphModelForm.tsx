import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { FieldModel } from "../../core/graph/types";
import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { Toggle } from "../Toggle";
import { EdgeIcon, NodeIcon } from "../common-icons";

const FieldModelsComponent: FC<{ fields: FieldModel[] }> = ({ fields }) => {
  const { setFieldModel } = useGraphDatasetActions();
  const { t } = useTranslation();

  return (
    <div>
      {fields.map((field) => (
        <div key={field.id} className="mt-1  p-2">
          <div className="fs-5">{field.id}</div>
          <div className="d-flex justify-content-around align-items-center">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name={`${field.id}-quali`}
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
            <div className="form-check ">
              <input
                className="form-check-input"
                type="checkbox"
                name={`${field.id}-quanti`}
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
        </div>
      ))}
    </div>
  );
};

export const GraphModelForm: FC = () => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const { t } = useTranslation();
  const [showEdges, setShowEdges] = useState<boolean>(false);
  return (
    <>
      <div className="d-flex justify-content-center mt-3">
        <Toggle
          value={showEdges}
          onChange={setShowEdges}
          leftLabel={
            <>
              <NodeIcon className="me-1" /> {t("graph.model.nodes")}
            </>
          }
          rightLabel={
            <>
              <EdgeIcon className="me-1" /> {t("graph.model.edges")}
            </>
          }
        />
      </div>

      {!showEdges ? <FieldModelsComponent fields={nodeFields} /> : <FieldModelsComponent fields={edgeFields} />}
    </>
  );
};

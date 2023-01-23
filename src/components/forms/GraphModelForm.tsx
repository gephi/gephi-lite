import { FC } from "react";

import { Tabs } from "../Tabs";
import { FieldModel } from "../../core/graph/types";
import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";

const FieldModelsComponent: FC<{ fields: FieldModel[] }> = ({ fields }) => {
  const { setFieldModel } = useGraphDatasetActions();

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
              quali
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
              quanti
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export const GraphModelForm: FC = () => {
  const { nodeFields, edgeFields } = useGraphDataset();

  return (
    <Tabs>
      <>Nodes</>
      <FieldModelsComponent fields={nodeFields} />
      <>Edges</>
      <FieldModelsComponent fields={edgeFields} />
    </Tabs>
  );
};

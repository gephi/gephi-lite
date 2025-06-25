import { omit } from "lodash";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFillTrashFill } from "react-icons/bs";
import { PiWarningCircleDuotone, PiWarningDiamondDuotone, PiWarningDuotone } from "react-icons/pi";

import { useGraphDataset, useGraphDatasetActions } from "../../core/context/dataContexts";
import { FieldModelWithStats } from "../../core/graph/types";
import { countExistingValues } from "../../core/graph/utils";
import { useModal } from "../../core/modals";
import { Toggle } from "../Toggle";
import { EdgeIcon, NodeIcon } from "../common-icons";
import ConfirmModal from "../modals/ConfirmModal";

const FieldModelsComponent: FC<{ fields: FieldModelWithStats[] }> = ({ fields }) => {
  const { setFieldModel, deleteItemsAttribute } = useGraphDatasetActions();
  const { t } = useTranslation();
  const { openModal } = useModal();

  return (
    <div>
      {!fields.length && <div className="text-muted fst-italic text-center mt-3">{t("graph.model.no_attributes")}</div>}
      {fields.map((field) => (
        <div key={field.id} className="mt-1  p-2">
          <div className="d-flex justify-content-between align-items-center ">
            <div className="fs-5">{field.id}</div>
          </div>
          <div className="d-flex gap-4 align-items-center">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name={`${field.id}-quali`}
                id={`${field.id}-quali`}
                checked={!!field.qualitative}
                onChange={(e) =>
                  setFieldModel({
                    ...omit(field, ["stats"]),
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
                    ...omit(field, ["stats"]),
                    quantitative: e.target.checked ? {} : null,
                  })
                }
              />
              <label className="form-check-label" htmlFor={`${field.id}-quanti`}>
                {t("graph.model.attribute.quantitative")}
              </label>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              title={`${t(`edition.delete_${field.itemType}_attributes`, { name: field.id })}`}
              onClick={() => {
                openModal({
                  component: ConfirmModal,
                  arguments: {
                    title: t(`edition.delete_${field.itemType}_attributes`, { name: field.id }),
                    message: t(`edition.confirm_delete_attributes`, { name: field.id, nbValues: field.stats.nbItems }),
                    successMsg: t("edition.delete_attributes_success", { name: field.id }),
                  },
                  afterSubmit: () => {
                    deleteItemsAttribute(field.itemType, field.id);
                  },
                });
              }}
            >
              <BsFillTrashFill />
            </button>
          </div>
          {(field.stats.nbItems === 0 || field.stats.nbMissingValues !== 0 || field.stats.nbCastIssues !== 0) && (
            <div className="d-flex flex-wrap flex-gap-1 small gap-2">
              {field.stats.nbCastIssues > 0 && (
                <div>
                  <PiWarningCircleDuotone className="text-info" />{" "}
                  {t("graph.model.warnings.wrong", { nbValues: field.stats.nbCastIssues })}
                </div>
              )}
              {field.stats.nbMissingValues !== 0 && field.stats.nbItems !== 0 && (
                <div>
                  <PiWarningDiamondDuotone className="text-warning" />{" "}
                  {t("graph.model.warnings.missing", { nbValues: field.stats.nbMissingValues })}
                </div>
              )}
              {field.stats.nbItems === 0 && (
                <div>
                  <PiWarningDuotone className="text-danger" /> {t("graph.model.warnings.allMissing")}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const GraphModelForm: FC = () => {
  const { nodeFields, edgeFields, nodeData, edgeData } = useGraphDataset();
  const nodeFieldsWithStats = countExistingValues(nodeFields, nodeData);
  const edgeFieldsWithStats = countExistingValues(edgeFields, edgeData);

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

      <FieldModelsComponent fields={showEdges ? edgeFieldsWithStats : nodeFieldsWithStats} />
    </>
  );
};

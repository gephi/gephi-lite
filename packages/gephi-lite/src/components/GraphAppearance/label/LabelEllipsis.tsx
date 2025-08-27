import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions } from "../../../core/context/dataContexts";
import { ItemType } from "../../../core/types";

export const LabelEllipsis: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { nodesLabelEllipsis, edgesLabelEllipsis } = useAppearance();
  const { setNodesLabelEllipsisAppearance, setEdgesLabelEllipsisAppearance } = useAppearanceActions();

  const labelEllipsis = itemType === "nodes" ? nodesLabelEllipsis : edgesLabelEllipsis;
  const setLabelEllipsis = itemType === "nodes" ? setNodesLabelEllipsisAppearance : setEdgesLabelEllipsisAppearance;

  return (
    <div className="panel-block">
      <div className="form-check">
        <input
          id="label-ellipsis"
          className="form-check-input mt-0 me-2"
          type="checkbox"
          checked={labelEllipsis.enabled}
          onChange={(e) => setLabelEllipsis({ ...labelEllipsis, enabled: e.target.checked })}
        />
        <label className="form-check-label" htmlFor="label-ellipsis">
          {t("appearance.labels.ellipsis.enabled")}
        </label>
      </div>

      {labelEllipsis.enabled && (
        <div className="d-flex align-items-center mt-1 flex-grow-1">
          <input
            id="label-ellipsis-length"
            className="form-control form-control-sm w-5"
            type="number"
            disabled={!labelEllipsis.enabled}
            value={labelEllipsis.maxLength}
            min={1}
            step={1}
            onChange={(e) => setLabelEllipsis({ ...labelEllipsis, maxLength: e.target.valueAsNumber })}
          />
          <label className="form-check-label small ms-1" htmlFor="label-ellipsis-length">
            {t("appearance.labels.ellipsis.max_length")}
          </label>
        </div>
      )}
    </div>
  );
};

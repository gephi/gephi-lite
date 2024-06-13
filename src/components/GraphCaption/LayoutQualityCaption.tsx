import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useLayoutState, usePreferences } from "../../core/context/dataContexts";
import { LayoutsIcon } from "../common-icons";

export const LayoutQualityCaption: FC = () => {
  const { t } = useTranslation();
  const { quality } = useLayoutState();
  const { locale } = usePreferences();

  if (!quality.enabled) return null;

  return (
    <div className="graph-caption-item">
      <div className="d-flex align-items-center mb-1">
        <LayoutsIcon title="Layout" className="fs-4 me-1" />
        <div className="d-flex flex-column justify-content-center m-2">
          <span className="text-muted caption-item-label">{t("layouts.quality.title")}</span>
          <h6 className="m-0 d-flex align-items-center">Connected Closeness</h6>
        </div>
      </div>
      <div className="caption text-center">
        {quality.metric?.ePercentOfDeltaMax
          ? Math.round(quality.metric.ePercentOfDeltaMax * 100).toLocaleString(locale, { compactDisplay: "short" }) +
            "%"
          : "N/A"}{" "}
      </div>
    </div>
  );
};

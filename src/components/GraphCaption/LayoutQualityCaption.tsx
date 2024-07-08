import { isNaN } from "lodash";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useLayoutState, usePreferences } from "../../core/context/dataContexts";
import { LayoutsIcon } from "../common-icons";

export const LayoutQualityCaption: FC = () => {
  const { t } = useTranslation();
  const { quality } = useLayoutState();
  const { locale } = usePreferences();
  const error = quality.metric?.cMax === undefined || isNaN(quality.metric?.cMax);
  const formatNumber = useCallback(
    (n?: number) => (n ? Math.round(n * 100).toLocaleString(locale, { compactDisplay: "short" }) + "%" : "N/A"),
    [locale],
  );

  if (!quality.enabled) return null;

  return (
    <div className="graph-caption-item">
      <div className="d-flex align-items-center mb-1">
        <LayoutsIcon title="Layout" className="fs-4 me-1" />
        <div className="d-flex flex-column justify-content-center m-2">
          <span className="text-muted caption-item-label">{t("layouts.quality.title")} </span>
          <h6 className="m-0 d-flex align-items-center">Connected Closeness</h6>
        </div>
      </div>
      <div className="caption text-center flex flex-column" style={{ maxWidth: "250px" }}>
        {error ? (
          "ERROR"
        ) : (
          <>
            <div>
              <span>{formatNumber(quality.metric?.cMax)} </span>
              <span className="small text-muted">{t("layouts.quality.caption_CMax")} </span>
            </div>
            {quality.showGrid && (
              <div>
                <span className="small text-muted">{t("layouts.quality.caption_deltaMax")}</span>
                {quality.metric?.deltaMax
                  ? quality.metric?.deltaMax.toLocaleString(locale, {
                      compactDisplay: "short",
                      maximumFractionDigits: 0,
                    })
                  : "N/A"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

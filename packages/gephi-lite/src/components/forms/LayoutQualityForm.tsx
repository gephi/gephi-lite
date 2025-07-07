import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useLayoutActions, useLayoutState } from "../../core/context/dataContexts";

export const LayoutQualityForm: FC = () => {
  const { t } = useTranslation();
  const { quality } = useLayoutState();
  const { setQuality } = useLayoutActions();

  return (
    <div className="panel-body">
      <h2>{t("layouts.quality.title")}</h2>

      <p className="gl-text-muted">
        {t("layouts.quality.description")}{" "}
        <a href="https://jgaa.info/index.php/jgaa/article/view/paper626" target="_blank" rel="noreferrer">
          (Jacomy 2023)
        </a>
      </p>

      <div className="panel-block">
        <div className="form-check">
          <input
            className="form-check-input"
            id="qualityEnabled"
            checked={quality.enabled}
            type="checkbox"
            onChange={(e) => setQuality({ ...quality, enabled: e.target.checked })}
          />
          <label htmlFor="qualityEnabled" className="form-check-label">
            {t("layouts.quality.enable")}
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            id="qualityGrid"
            checked={quality.showGrid}
            type="checkbox"
            onChange={(e) => setQuality({ ...quality, showGrid: e.target.checked })}
          />
          <label htmlFor="qualityGrid" className="form-check-label">
            {t("layouts.quality.showGrid")}
          </label>
        </div>
      </div>
    </div>
  );
};

import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useLayoutActions, useLayoutState } from "../../core/context/dataContexts";

export const LayoutQualityForm: FC = () => {
  const { t } = useTranslation();
  const { quality } = useLayoutState();
  const { setQuality } = useLayoutActions();

  return (
    <div className="panel-wrapper">
      <h3 className="fs-5">{t("layouts.quality.title")}</h3>
      <p className="text-muted small d-none d-md-block">
        {t("layouts.quality.description")}{" "}
        <a href="https://jgaa.info/index.php/jgaa/article/view/paper626" target="_blank" rel="noreferrer">
          (Jacomy 2023)
        </a>
      </p>

      <div className="form-check">
        <input
          className="form-check-input"
          id="qualityEnabled"
          checked={quality.enabled}
          type="checkbox"
          onChange={(e) => setQuality({ ...quality, enabled: e.target.checked })}
        />
        <label htmlFor="qualityEnabled">{t("layouts.quality.enable")}</label>
      </div>
      <div className="form-check">
        <input
          className="form-check-input"
          id="qualityGrid"
          checked={quality.showGrid}
          type="checkbox"
          onChange={(e) => setQuality({ ...quality, showGrid: e.target.checked })}
        />
        <label htmlFor="qualityGrid">{t("layouts.quality.showGrid")}</label>
      </div>
    </div>
  );
};

import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useLayoutActions } from "../../core/context/dataContexts";
import { layoutStateAtom } from "../../core/layouts";

export const LayoutQualityForm: FC = () => {
  const { t } = useTranslation();
  const { quality } = layoutStateAtom.get();
  const { setQuality } = useLayoutActions();

  return (
    <div className="panel-block">
      {t("layouts.quality.title")}
      <p className="text-muted small d-none d-md-block">{t("layouts.quality.description")}</p>
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

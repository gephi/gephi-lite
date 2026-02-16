import { MapBackgroundLayer } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions } from "../../../core/context/dataContexts";
import { useModal } from "../../../core/modals";
import { getDefaultMapStyle } from "../../../utils/map-style";
import { CodeEditorIcon } from "../../common-icons";
import { MapStyleEditorModal } from "./MapStyleEditorModal";

export const MapBackgroundLayerForm: FC = () => {
  const { t } = useTranslation();
  const { backgroundLayer } = useAppearance();
  const { setBackgroundLayer } = useAppearanceActions();
  const { openModal } = useModal();

  const mapLayer = backgroundLayer?.type === "map" ? backgroundLayer : null;

  const setMapLayer = (updates: Partial<MapBackgroundLayer["map"]>) => {
    const current = mapLayer?.map || { engine: "maplibre" };
    setBackgroundLayer({ type: "map", map: { ...current, ...updates } });
  };

  const currentStyle = mapLayer?.map.style;
  const styleName = (currentStyle?.name as string) || t("appearance.background.map.maplibre.custom_style");

  return (
    <div className="panel-block">
      <h3>{t("appearance.background.map.title")}</h3>

      <div className="panel-block">
        <p className="form-text small text-muted">
          <Trans
            i18nKey={"appearance.background.map.maplibre.style_description"}
            components={{
              maplibreLink: <a href="https://maplibre.org/" target="_blank" rel="noreferrer" />,
              maplibreStyleLink: (
                <a href="https://maplibre.org/maplibre-style-spec/" target="_blank" rel="noreferrer" />
              ),
              gephiLiteDocLink: (
                <a href="https://docs.gephi.org/lite/user-manual/map" target="_blank" rel="noreferrer" />
              ),
            }}
          />
        </p>

        <label className="form-label">{t("appearance.background.map.maplibre.style")}</label>
        <div className="d-flex align-items-center gl-gap-2">
          <span className="flex-grow-1 text-ellipsis">
            {currentStyle ? styleName : t("appearance.background.map.maplibre.style_default")}
          </span>
          <button
            type="button"
            className="gl-btn gl-btn-outline gl-btn-sm"
            title={t("appearance.background.map.maplibre.edit_style")}
            onClick={() =>
              openModal({
                component: MapStyleEditorModal,
                arguments: {
                  initialStyle: JSON.stringify(currentStyle || getDefaultMapStyle(), null, 2),
                },
                beforeSubmit: ({ style }) => setMapLayer({ style }),
              })
            }
          >
            <CodeEditorIcon className="me-1" />
            {t("common.edit")}
          </button>
          {currentStyle && (
            <button
              type="button"
              className="gl-btn gl-btn-outline gl-btn-sm"
              title={t("appearance.background.map.maplibre.reset_style")}
              onClick={() => setMapLayer({ style: undefined })}
            >
              {t("common.reset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

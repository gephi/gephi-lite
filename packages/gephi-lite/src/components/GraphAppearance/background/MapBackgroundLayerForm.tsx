import { MapBackgroundLayer } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import {
  useAppearance,
  useAppearanceActions,
  usePreferences,
  useSessionData,
} from "../../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../../core/context/eventsContext";
import { useModal } from "../../../core/modals";
import { getDefaultMapStyle } from "../../../utils/map-style";
import MessageTooltip from "../../MessageTooltip";
import { CodeEditorIcon, ResetIcon } from "../../common-icons";
import { MapStyleEditorModal } from "./MapStyleEditorModal";

export const MapBackgroundLayerForm: FC = () => {
  const { t } = useTranslation();
  const { backgroundLayer } = useAppearance();
  const { setBackgroundLayer } = useAppearanceActions();
  const { layoutsParameters } = useSessionData();
  const { theme } = usePreferences();
  const { openModal } = useModal();
  const { emitter } = useEventsContext();

  const mapLayer = backgroundLayer?.type === "map" ? backgroundLayer : null;
  let mapScale = mapLayer?.map.scale;
  if (!mapScale) {
    if (layoutsParameters["geographic"] && layoutsParameters["geographic"].scale)
      mapScale = layoutsParameters["geographic"].scale as number;
    else mapScale = 1;
  }

  const setMapLayer = (updates: Partial<MapBackgroundLayer["map"]>) => {
    const current = mapLayer?.map || { engine: "maplibre" };
    setBackgroundLayer({ type: "map", map: { ...current, ...updates } });
  };

  const currentStyle = mapLayer?.map.style;

  return (
    <>
      <div className="panel-block">
        <h3>{t("appearance.background.map.title")}</h3>

        <div className="panel-block">
          <label className="form-label">{t("appearance.background.map.maplibre.style")}</label>
          <div className="w-100 d-flex gl-gap-1">
            {currentStyle && (
              <button
                type="button"
                className="gl-btn gl-btn-outline gl-btn-sm"
                title={t("appearance.background.map.maplibre.reset_style")}
                onClick={() => setMapLayer({ style: undefined })}
              >
                <ResetIcon />
              </button>
            )}
            <button
              type="button"
              className="gl-btn gl-btn-outline gl-btn-sm flex-grow-1"
              title={t("appearance.background.map.maplibre.edit_style")}
              onClick={() =>
                openModal({
                  component: MapStyleEditorModal,
                  arguments: {
                    initialStyle: JSON.stringify(currentStyle || getDefaultMapStyle(theme), null, 2),
                  },
                  beforeSubmit: ({ style }) => setMapLayer({ style }),
                })
              }
            >
              <CodeEditorIcon className="me-1" />
              {t("common.edit")}
            </button>
          </div>
        </div>

        <div className="panel-block">
          <div className="d-flex gl-gap-1 align-items-center">
            <label htmlFor="map-scale">{t("appearance.background.map.scale.title")}</label>
            <MessageTooltip message={t("appearance.background.map.scale.description")} />
          </div>
          <input
            type="number"
            className="form-control form-control-sm"
            id="map-scale"
            value={mapScale}
            onChange={(e) => setMapLayer({ scale: e.target.valueAsNumber })}
          />
        </div>

        <div className="panel-block">
          <p className="gl-text-muted mb-0">{t("appearance.background.map.position_warning")}</p>
          <button
            className="gl-btn gl-btn-outline"
            onClick={() => emitter.emit(EVENTS.openMenu, { menuId: `layout-geographic` })}
          >
            {t("appearance.background.map.open_geo_layout")}
          </button>
        </div>
      </div>
    </>
  );
};

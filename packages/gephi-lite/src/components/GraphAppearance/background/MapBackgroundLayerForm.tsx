import { MapBackgroundLayer } from "@gephi/gephi-lite-sdk";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions, usePreferences } from "../../../core/context/dataContexts";
import { EVENTS, useEventsContext } from "../../../core/context/eventsContext";
import { useModal } from "../../../core/modals";
import { getDefaultMapStyle } from "../../../utils/map-style";
import MessageAlert from "../../MessageAlert";
import { CodeEditorIcon } from "../../common-icons";
import { MapStyleEditorModal } from "./MapStyleEditorModal";

export const MapBackgroundLayerForm: FC = () => {
  const { t } = useTranslation();
  const { backgroundLayer } = useAppearance();
  const { theme } = usePreferences();
  const { setBackgroundLayer } = useAppearanceActions();
  const { openModal } = useModal();
  const { emitter } = useEventsContext();

  const mapLayer = backgroundLayer?.type === "map" ? backgroundLayer : null;

  const setMapLayer = (updates: Partial<MapBackgroundLayer["map"]>) => {
    const current = mapLayer?.map || { engine: "maplibre" };
    setBackgroundLayer({ type: "map", map: { ...current, ...updates } });
  };

  const currentStyle = mapLayer?.map.style;
  const styleName = (currentStyle?.name as string) || t("appearance.background.map.maplibre.custom_style");

  return (
    <>
      {/* TODO : this message can be visible only if no geo layout have been executed on the graph. */}
      <MessageAlert
        message={
          <>
            <p>{t("appearance.background.map.position_warning")}</p>
            <button
              className="gl-btn gl-btn-outline gl-btn-sm"
              onClick={() => emitter.emit(EVENTS.openMenu, { menuId: `layout-geographic` })}
            >
              {t("appearance.background.map.open_geo_layout")}
            </button>
          </>
        }
        type="success"
      />

      <div className="panel-block">
        <h3>{t("appearance.background.map.title")}</h3>

        <div className="panel-block">
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
                    initialStyle: JSON.stringify(currentStyle || getDefaultMapStyle(theme), null, 2),
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
    </>
  );
};

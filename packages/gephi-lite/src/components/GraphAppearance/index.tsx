import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions, usePreferences } from "../../core/context/dataContexts";
import { useModal } from "../../core/modals";
import { ItemType } from "../../core/types";
import { getDefaultMapStyle } from "../../utils/map-style";
import ColorPicker from "../ColorPicker";
import { CodeEditorIcon, ResetIcon } from "../common-icons";
import { MapStyleEditorModal } from "./background/MapStyleEditorModal";
import { ColorItem } from "./color/ColorItem";
import { StringAttrItem } from "./label/StringAttrItem";
import { SizeItem } from "./size/SizeItem";
import { EdgesZIndexItem } from "./zIndex/EdgesZIndexItem";

export const GraphItemAppearance: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { t } = useTranslation();
  const { showEdges } = useAppearance();
  const { setShowEdges } = useAppearanceActions();

  return (
    <div className="panel-body">
      <h2>{t(`appearance.menu.${itemType}`)}</h2>

      {itemType === "edges" && (
        <div className="panel-block">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={showEdges.value}
              onChange={(e) => setShowEdges({ value: e.target.checked })}
              id="show-edges"
            />
            <label className="form-check-label" htmlFor="show-edges">
              {t("appearance.show_edges")}
            </label>
          </div>
        </div>
      )}

      <ColorItem itemType={itemType} />
      <SizeItem itemType={itemType} />

      {itemType === "nodes" && (
        <div className="panel-block">
          <h3>{t(`appearance.images.title`)}</h3>
          <StringAttrItem itemType={itemType} itemKey="images" />
        </div>
      )}

      {itemType === "edges" && <EdgesZIndexItem />}
    </div>
  );
};

export const GraphBackgroundAppearance: FC<unknown> = () => {
  const { t } = useTranslation();
  const { theme } = usePreferences();
  const { openModal } = useModal();
  const { backgroundColor, backgroundMapStyle, layoutGridColor } = useAppearance();
  const { setBackgroundColorAppearance, setLayoutGridColorAppearance, setBackgroundMapStyle } = useAppearanceActions();

  return (
    <div className="panel-body">
      <h2>{t("appearance.menu.background")}</h2>

      <div className="panel-block">
        <div className="d-flex align-items-baseline">
          <label className="me-3 flex-grow-1">{t("appearance.graph.background_color")}</label>
          <ColorPicker
            className="w-auto h-100"
            color={backgroundColor}
            clearable
            onChange={(v) => setBackgroundColorAppearance(v)}
          />
        </div>

        <div className="d-flex align-items-baseline">
          <label className="me-3 flex-grow-1">{t("appearance.graph.layout_grid_color")}</label>
          <ColorPicker
            className="w-auto h-100"
            color={layoutGridColor}
            clearable
            onChange={(v) => setLayoutGridColorAppearance(v)}
          />
        </div>
      </div>

      <div className="panel-block">
        <h3>{t("appearance.background.map.title")}</h3>

        <div className="panel-block">
          <label className="form-label">{t("appearance.background.map.maplibre.style")}</label>
          <div className="w-100 d-flex gl-gap-1">
            {backgroundMapStyle && (
              <button
                type="button"
                className="gl-btn gl-btn-outline gl-btn-sm"
                title={t("appearance.background.map.maplibre.reset_style")}
                onClick={() => setBackgroundMapStyle(null)}
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
                    initialStyle: JSON.stringify(backgroundMapStyle || getDefaultMapStyle(theme), null, 2),
                  },
                  beforeSubmit: ({ style }) => setBackgroundMapStyle(style),
                })
              }
            >
              <CodeEditorIcon className="me-1" />
              {t("common.edit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

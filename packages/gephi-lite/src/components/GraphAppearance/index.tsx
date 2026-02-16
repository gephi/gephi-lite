import { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAppearance, useAppearanceActions } from "../../core/context/dataContexts";
import { ItemType } from "../../core/types";
import ColorPicker from "../ColorPicker";
import { EnumInput } from "../forms/TypedInputs";
import { MapBackgroundLayerForm } from "./background/MapBackgroundLayerForm";
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

type LayerMode = "none" | "map";

export const GraphBackgroundAppearance: FC<unknown> = () => {
  const { t } = useTranslation();
  const { backgroundColor, layoutGridColor, backgroundLayer } = useAppearance();
  const { setBackgroundColorAppearance, setLayoutGridColorAppearance, setBackgroundLayer } = useAppearanceActions();

  const layerMode: LayerMode = backgroundLayer?.type || "none";

  const layerModeOptions = useMemo(
    () => [
      { value: "none", label: t("appearance.background.none") },
      { value: "map", label: t("appearance.background.map.label") },
    ],
    [t],
  );

  const enableMapLayer = useCallback(() => {
    setBackgroundLayer({ type: "map", map: { engine: "maplibre" } });
  }, [setBackgroundLayer]);

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
        <EnumInput
          id="background-layer-mode"
          label={t("appearance.background.layer_mode")}
          value={layerMode}
          options={layerModeOptions}
          onChange={(v) => {
            if (v === "map") enableMapLayer();
            else setBackgroundLayer(undefined);
          }}
          required
        />
      </div>

      {layerMode === "map" && <MapBackgroundLayerForm />}
    </div>
  );
};

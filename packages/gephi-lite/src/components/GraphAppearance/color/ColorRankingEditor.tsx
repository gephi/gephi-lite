import { RankingColor } from "@gephi/gephi-lite-sdk";
import chroma from "chroma-js";
import { last, sortBy } from "lodash";
import { FC, HTMLProps, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactSlider from "react-slider";

import { ItemType } from "../../../core/types";
import ColorPicker from "../../ColorPicker";
import ColorPickerTooltip from "./ColorPickerTooltip";

const minDistance = 0.05;

export const ColorRankingEditor: FC<{
  itemType: ItemType;
  color: RankingColor;
  setColor: (newColor: RankingColor) => void;
}> = ({ itemType, color, setColor }) => {
  const { t } = useTranslation();

  const values = useMemo(() => color.colorScalePoints.map((m) => m.scalePoint), [color.colorScalePoints]);

  const [isDraggingTrack, setIsDraggingTrack] = useState<boolean>(false);

  const thumbRenderer: (
    props: HTMLProps<HTMLDivElement>,
    state: {
      index: number;
      value: number[];
      valueNow: number;
    },
  ) => JSX.Element | null = useCallback(
    (props, state) => (
      <ColorPickerTooltip
        key={state.index}
        colorScalePoint={color.colorScalePoints[state.index]}
        targetProps={props}
        onChange={(newColorScalePoint) => {
          const newColors = {
            ...color,
            colorScalePoints: color.colorScalePoints.map((csp, i) => {
              if (i === state.index) return newColorScalePoint;
              else return csp;
            }),
          };
          setColor(newColors);
        }}
        scalePointBounds={[
          color.colorScalePoints[state.index - 1]?.scalePoint + minDistance || 0.0,
          color.colorScalePoints[state.index + 1]?.scalePoint - minDistance || 1.0,
        ]}
        onDelete={() => {
          setColor({ ...color, colorScalePoints: color.colorScalePoints.filter((_, i) => i !== state.index) });
        }}
      />
    ),
    [color, setColor],
  );
  return (
    <>
      <label className="mt-2 mb-1 from-check-label small">{t("appearance.color.ranking_intro")}</label>
      <ReactSlider
        key={values.length}
        className="horizontal-slider"
        thumbClassName="thumb"
        trackClassName="track"
        snapDragDisabled
        renderThumb={thumbRenderer}
        onSliderClick={(position) => {
          // create new thumb on track click only if no dragging
          if (!isDraggingTrack) {
            const colorScale = chroma
              .scale(color.colorScalePoints.map((point) => point.color))
              .domain(color.colorScalePoints.map((csp) => csp.scalePoint));
            setColor({
              ...color,
              colorScalePoints: sortBy(
                color.colorScalePoints.concat({
                  color: colorScale(position).hex(),
                  scalePoint: position,
                }),
                (csp) => csp.scalePoint,
              ),
            });
          }
          //stop track dragging
          setIsDraggingTrack(false);
        }}
        renderTrack={(props, state) => (
          <div
            {...props}
            style={{
              ...props.style,
              background:
                state.index > 0 && state.index < state.value.length
                  ? `linear-gradient(90deg, ${color.colorScalePoints[state.index - 1].color}, ${
                      color.colorScalePoints[state.index].color
                    })`
                  : state.index === 0
                    ? color.colorScalePoints[0].color
                    : state.index === state.value.length
                      ? last(color.colorScalePoints)?.color
                      : undefined,
            }}
            onMouseMove={(e) => {
              //detect track dragging
              if (!isDraggingTrack && e.buttons === 1) {
                setIsDraggingTrack(true);
              }
            }}
          />
        )}
        value={values}
        min={0}
        max={1}
        step={0.01}
        pearling
        minDistance={minDistance}
        onAfterChange={(values) => {
          //TODO: use onChange + debounce?
          if (Array.isArray(values))
            setColor({
              ...color,
              colorScalePoints: color.colorScalePoints.map((csp, i) => ({
                ...csp,
                scalePoint: values[i],
              })),
            });
        }}
      />

      <div>
        <div className="d-flex align-items-baseline mt-1">
          <ColorPicker color={color.missingColor} onChange={(v) => setColor({ ...color, missingColor: v })} />
          <label className="form-check-label small ms-1">
            {t("appearance.color.default_value", { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      </div>
    </>
  );
};

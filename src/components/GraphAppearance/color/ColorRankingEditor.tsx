import { FC, HTMLProps, useCallback, useMemo, useState } from "react";
import chroma from "chroma-js";
import { useTranslation } from "react-i18next";
import ReactSlider from "react-slider";

import { ItemType } from "../../../core/types";
import { RankingColor } from "../../../core/appearance/types";
import { max, sortBy } from "lodash";
import ColorPickerTooltip from "./ColorPickerTooltip";

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
        value={color.colorScalePoints[state.index].color}
        targetProps={props}
        targetState={state}
        onChange={() => {
          console.log("TODO");
        }}
      />
    ),
    [color.colorScalePoints],
  );

  return (
    <>
      <ReactSlider
        key={values.length}
        className="horizontal-slider"
        thumbClassName="thumb"
        trackClassName="track"
        snapDragDisabled
        renderThumb={thumbRenderer}
        onSliderClick={(position) => {
          if (!isDraggingTrack) {
            setColor({
              ...color,
              colorScalePoints: sortBy(
                color.colorScalePoints.concat({
                  color: chroma.random().hex(),
                  scalePoint: position,
                }),
                (csp) => csp.scalePoint,
              ),
            });
          }
          setIsDraggingTrack(false);
        }}
        renderTrack={(props, state) => (
          <div
            {...props}
            style={{
              ...props.style,
              background:
                state.index > 0 && state.index < color.colorScalePoints.length
                  ? `linear-gradient(90deg, ${color.colorScalePoints[state.index - 1].color}, ${
                      color.colorScalePoints[state.index].color
                    })`
                  : undefined,
              right: max([0, props.style?.right]),
            }}
            onMouseMove={(e) => {
              if (e.buttons === 1) {
                e.stopPropagation();
                e.preventDefault();
                setIsDraggingTrack(true);
              }
            }}
          />
        )}
        value={values}
        min={0.01}
        max={0.99}
        step={0.01}
        pearling
        onAfterChange={(values) => {
          if (Array.isArray(values))
            setColor({
              ...color,
              colorScalePoints: color.colorScalePoints.map((csp, i) => ({
                ...csp,
                scalePoint: i === 0 ? 0 : i === values.length - 1 ? 1 : values[i],
              })),
            });
        }}
      />

      <div>
        {color.colorScalePoints.map((sc, index) => {
          return (
            <div key={index} className="d-flex align-items-center mt-1">
              <input
                className="form-control form-control-sm form-control-color d-inline-block"
                type="color"
                value={sc.color}
                onChange={(e) =>
                  setColor({
                    ...color,
                    colorScalePoints:
                      color.colorScalePoints.map((ssc, i) =>
                        i === index ? { scalePoint: sc.scalePoint, color: e.target.value } : ssc,
                      ) || [],
                  })
                }
              />
              {color.colorScalePoints.length > 1 && (
                <button
                  className="btn btn-outline-dark btn-sm ms-2"
                  onClick={() =>
                    setColor({
                      ...color,
                      colorScalePoints: color.colorScalePoints.filter((ssc, i) => i !== index) || [],
                    })
                  }
                >
                  - {t("common.delete")}
                </button>
              )}
            </div>
          );
        })}
        <button
          className="btn btn-outline-dark btn-sm mt-2"
          onClick={() =>
            setColor({
              ...color,
              colorScalePoints: color.colorScalePoints.concat({
                color: chroma.random().hex(),
                scalePoint: 1,
              }),
            })
          }
        >
          + {t("common.add")}
        </button>

        <div className="d-flex align-items-center mt-1">
          <input
            className="form-control form-control-sm form-control-color d-inline-block flex-grow-0 flex-shrink-0"
            type="color"
            value={color.missingColor}
            onChange={(v) => setColor({ ...color, missingColor: v.target.value })}
            id={`${itemType}-defaultColor`}
          />
          <label className="form-check-label small ms-1" htmlFor={`${itemType}-defaultColor`}>
            {t("appearance.color.default_value", { items: t(`graph.model.${itemType}`) })}
          </label>
        </div>
      </div>
      {/*<div>*/}
      {/*  TODO:*/}
      {/*  <TransformationMethodsSelect />*/}
      {/*</div>*/}
    </>
  );
};

import { last, range } from "lodash";
import { FC, HTMLProps, useCallback } from "react";
import ReactSlider from "react-slider";

import { ColorScalePointType } from "../../core/appearance/types";
import { RangeExtends } from "./index";

export const ColorSlider: FC<{
  colorScalePoints: ColorScalePointType[];
  extend: RangeExtends;
}> = ({ colorScalePoints, extend }) => {
  const formatValueFromScalePoint = useCallback(
    (value: number) =>
      value === 0
        ? extend.getLabel(extend.min, extend.max - extend.min)
        : value === 1
          ? extend.getLabel(extend.max, extend.max - extend.min)
          : extend.getLabel(value * (extend.max - extend.min) + extend.min, extend.max - extend.min),
    [extend],
  );

  const thumbRenderer: (
    props: HTMLProps<HTMLDivElement>,
    state: {
      index: number;
      value: number[];
      valueNow: number;
    },
  ) => JSX.Element | null = useCallback(
    (props, state) => {
      const colorScalePoint = colorScalePoints[state.index];
      return (
        <>
          <span
            {...props}
            style={{
              ...props.style,
              backgroundColor: colorScalePoint.color,
            }}
            title={formatValueFromScalePoint(state.valueNow)}
          >
            {(state.index === 0 || state.index === state.value.length - 1) && (
              <span className="label">{formatValueFromScalePoint(state.valueNow)}</span>
            )}
          </span>
        </>
      );
    },
    [colorScalePoints, formatValueFromScalePoint],
  );

  return (
    <ReactSlider
      className="horizontal-slider"
      thumbClassName="thumb"
      trackClassName="track"
      disabled
      snapDragDisabled
      renderThumb={thumbRenderer}
      marks={range(0, 1, 0.01)}
      renderMark={(props) => {
        return (
          <span
            {...props}
            title={
              props.key !== null && props.key !== undefined
                ? formatValueFromScalePoint(+(props.key as string | number))
                : undefined
            }
          />
        );
      }}
      markClassName="tick"
      renderTrack={(props, state) => {
        return (
          <div
            {...props}
            style={{
              ...props.style,
              background:
                state.index > 0 && state.index < state.value.length
                  ? `linear-gradient(90deg, ${colorScalePoints[state.index - 1].color}, ${
                      colorScalePoints[state.index].color
                    })`
                  : state.index === 0
                    ? colorScalePoints[0].color
                    : state.index === state.value.length
                      ? last(colorScalePoints)?.color
                      : undefined,
            }}
          />
        );
      }}
      value={colorScalePoints.map((csp) => csp.scalePoint)}
      min={0}
      max={1}
      step={0.01}
    />
  );
};

import { ColorScalePointType } from "@gephi/gephi-lite-sdk";
import { FC, HTMLProps, useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import { useTranslation } from "react-i18next";
import TetherComponent from "react-tether";

const ColorPickerTooltip: FC<{
  targetProps: HTMLProps<HTMLDivElement>;
  colorScalePoint: ColorScalePointType;
  scalePointBounds: [number, number];
  onChange: (newColorScalePoint: ColorScalePointType) => void;
  onDelete: () => void;
}> = ({ onChange, targetProps, colorScalePoint, onDelete, scalePointBounds }) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState<boolean>(false);

  const { t } = useTranslation();

  const pickerWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) {
      return;
    }

    const handleClickBody = (e: MouseEvent) => {
      if (pickerWrapper.current && !pickerWrapper.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };

    setTimeout(() => document.body.addEventListener("click", handleClickBody), 0);
    return () => document.body.removeEventListener("click", handleClickBody);
  }, [showPicker]);

  return (
    <TetherComponent
      attachment="top left"
      targetAttachment="bottom left"
      className="over-modal shadow"
      constraints={[{ to: "scrollparent", attachment: "together", pin: true }]}
      renderTarget={(ref) => (
        <div
          {...targetProps}
          style={{
            ...targetProps.style,
            backgroundColor: colorScalePoint.color,
          }}
          onClick={(e) => {
            if (isDraggingThumb === false) {
              //single click no dragging => show picker
              setShowPicker(!showPicker);
            }
            // prevent thumb creation on track click
            e.stopPropagation();
            e.preventDefault();
            // adding a click on the body to close other already opened color pickers
            document.body.click();
            // drag stops
            setIsDraggingThumb(false);
          }}
          onMouseMove={(e) => {
            //detect dragging
            if (!isDraggingThumb && e.buttons === 1) {
              setIsDraggingThumb(true);
            }
          }}
        >
          <div ref={ref} className="w-100 h-100"></div>
        </div>
      )}
      renderElement={(ref) =>
        showPicker && (
          // We use two divs here to allow having "two refs":
          <div
            ref={ref}
            onClick={(e) => {
              // react-slider catch click event
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // react-slider catch click event
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              // react-slider catch click event
              e.stopPropagation();
            }}
          >
            <div ref={pickerWrapper} className="custom-color-picker">
              <SketchPicker
                color={colorScalePoint.color}
                onChange={(color, e) => {
                  onChange({ ...colorScalePoint, color: color.hex });
                  // To avoid text selection while draggin
                  if (e.stopPropagation) e.stopPropagation();
                  if (e.preventDefault) e.preventDefault();
                }}
                styles={{
                  default: {
                    picker: {
                      boxShadow: "none",
                      padding: 0,
                    },
                  },
                }}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="d-flex align-items-baseline">
                  <label htmlFor={`scalePoint`} className="form-label">
                    {t("appearance.color.scale_point")}
                  </label>
                  <input
                    id={`scalePoint`}
                    className="form-control form-control-sm w-5 ms-2"
                    type="number"
                    value={colorScalePoint.scalePoint}
                    min={scalePointBounds[0]}
                    max={scalePointBounds[1]}
                    step={0.01}
                    onChange={(e) => {
                      if (e.target.value !== "") onChange({ ...colorScalePoint, scalePoint: +e.target.value });
                    }}
                  />{" "}
                </div>
                <button className="btn btn-outline-dark btn-sm ms-2" onClick={onDelete}>
                  - {t("common.delete")}
                </button>
              </form>
            </div>
          </div>
        )
      }
    />
  );
};

export default ColorPickerTooltip;

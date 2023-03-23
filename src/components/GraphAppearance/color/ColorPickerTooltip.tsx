import { FC, HTMLProps, useContext, useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import { useTranslation } from "react-i18next";
import TetherComponent from "react-tether";
import { ColorScalePointType } from "../../../core/appearance/types";

import { UIContext } from "../../../core/context/uiContext";

const ColorPickerTooltip: FC<{
  id?: string;
  className?: string;
  disabled?: boolean;
  targetProps: HTMLProps<HTMLDivElement>;
  colorScalePoint: ColorScalePointType;

  onChange: (newColorScalePoint: ColorScalePointType) => void;
  onDelete?: () => void;
}> = ({ id, className, disabled, onChange, targetProps, colorScalePoint, onDelete }) => {
  const [color, setColor] = useState<string | undefined>();
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState<boolean>(false);
  const { portalTarget } = useContext(UIContext);
  const { t } = useTranslation();

  const pickerWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) {
      // if (color !== value) {
      //   console.log("picker validate", color);
      //   onChange(color);
      // }
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

  useEffect(() => {
    if (colorScalePoint?.color) setColor(colorScalePoint.color);
  }, [colorScalePoint.color]);

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
      renderElementTo={portalTarget}
      renderElement={(ref) =>
        showPicker && (
          // We use two divs here to allow having "two refs":
          <div
            ref={ref}
            onClick={(e) => {
              // react-slider catch click event
              //TODO : solve issue with inputs
              e.stopPropagation();
            }}
          >
            <div ref={pickerWrapper} className="custom-color-picker">
              <SketchPicker
                color={color}
                onChangeComplete={(color) => {
                  //TODO: debounce
                  onChange({ ...colorScalePoint, color: color.hex });
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
              {onDelete && (
                <form>
                  <div className="d-flex align-items-baseline">
                    <label htmlFor={`scalePoint`} className="form-label">
                      {t("appearance.color.scale_point")}
                    </label>
                    <input
                      id={`scalePoint`}
                      className="form-control form-control-sm w-5 ms-2"
                      type="number"
                      value={colorScalePoint.scalePoint * 100}
                      min={0}
                      max={100}
                      onChange={(e) => {
                        // never fired !
                        if (e.target.value !== "") onChange({ ...colorScalePoint, scalePoint: +e.target.value / 100 });
                      }}
                    />{" "}
                  </div>
                  <button className="btn btn-outline-dark btn-sm ms-2" onClick={onDelete}>
                    - {t("common.delete")}
                  </button>
                </form>
              )}
            </div>
          </div>
        )
      }
    />
  );
};

export default ColorPickerTooltip;

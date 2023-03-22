import { FC, HTMLProps, useContext, useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import TetherComponent from "react-tether";

import { UIContext } from "../../../core/context/uiContext";

const ColorPickerTooltip: FC<{
  id?: string;
  className?: string;
  disabled?: boolean;
  targetProps: HTMLProps<HTMLDivElement>;
  targetState: {
    index: number;
    value: number[];
    valueNow: number;
  };
  value: string;
  onChange: (newValue: string) => void;
}> = ({ id, className, disabled, value, onChange, targetProps, targetState }) => {
  const [color, setColor] = useState(value);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState<boolean>(false);
  const { portalTarget } = useContext(UIContext);

  const pickerWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) {
      if (color !== value) onChange(color);
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
    setColor(value);
  }, [value]);

  return (
    <TetherComponent
      attachment={"top center"}
      className="over-modal shadow"
      constraints={[{ to: "window", attachment: "together", pin: true }]}
      renderTarget={(ref) => (
        <div ref={ref}>
          <div
            {...targetProps}
            style={{
              ...targetProps.style,
              backgroundColor: value,
              left:
                targetState.index === 0
                  ? 0
                  : targetState.index === targetState.value.length - 1
                  ? undefined
                  : targetProps.style?.left,
              right: targetState.index === targetState.value.length - 1 ? 0 : undefined,
            }}
            onClick={(e) => {
              if (isDraggingThumb === false) {
                console.log("sho picker");
                setShowPicker(!showPicker);
              }
              e.stopPropagation();
              e.preventDefault();
              setIsDraggingThumb(false);
            }}
            onMouseMove={(e) => {
              if (!isDraggingThumb && e.buttons === 1) {
                if ([0, targetState.value.length - 1].includes(targetState.index)) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setIsDraggingThumb(true);
              }
            }}
          />
        </div>
      )}
      renderElementTo={portalTarget}
      renderElement={(ref) =>
        showPicker && (
          // We use two divs here to allow having "two refs":
          <div ref={ref}>
            <div ref={pickerWrapper} className="custom-color-picker">
              <SketchPicker
                color={color}
                onChange={(color) => setColor(color.hex)}
                styles={{
                  default: {
                    picker: {
                      boxShadow: "none",
                    },
                  },
                }}
              />
              <div className="addendum">
                <div className="form-check">
                  <button>TODO delete</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    />
  );
};

export default ColorPickerTooltip;

import { FC, useRef } from "react";
import { SketchPicker } from "react-color";

import { hexToRgba, rgbaToHex } from "../utils/colors";
import Tooltip, { TooltipAPI } from "./Tooltip";
import { CheckedIcon, CloseIcon } from "./common-icons";

export const InlineColorPicker: FC<{ color: string | undefined; onChange: (color: string | undefined) => void }> = ({
  color,
  onChange,
}) => {
  return (
    <SketchPicker
      color={color ? hexToRgba(color) : undefined}
      onChange={(color, e) => {
        onChange(rgbaToHex(color.rgb));
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
  );
};

const ColorPicker: FC<
  (
    | { color: string | undefined; onChange: (color: string | undefined) => void; clearable: true }
    | { color: string; onChange: (color: string) => void; clearable?: false }
  ) & { className?: string }
> = ({ color, onChange, clearable, className }) => {
  const tooltipRef = useRef<TooltipAPI>(null);

  return (
    <Tooltip ref={tooltipRef} attachment="top middle" targetAttachment="bottom middle" targetClassName={className}>
      <button
        type="button"
        className="gl-btn square border border-black border-2"
        style={{ background: color || "#ffffff" }}
      >
        <span style={{ color: "transparent" }}>X</span>
      </button>
      <div className="custom-color-picker gl-border">
        <InlineColorPicker onChange={onChange} color={color} />
        <div className="text-end gl-gap-1 d-flex justify-content-end">
          {clearable && (
            <button className="gl-btn gl-btn-icon gl-btn-outline" onClick={() => onChange(undefined)}>
              <CloseIcon />
            </button>
          )}
          <button className="gl-btn gl-btn-icon gl-btn-fill" onClick={() => tooltipRef.current?.close()}>
            <CheckedIcon />
          </button>
        </div>
      </div>
    </Tooltip>
  );
};

export default ColorPicker;

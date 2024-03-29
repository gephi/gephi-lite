import { FC, useRef } from "react";
import { SketchPicker } from "react-color";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

import { hexToRgba, rgbaToHex } from "../utils/colors";
import Tooltip, { TooltipAPI } from "./Tooltip";

const ColorPicker: FC<
  (
    | { color: string | undefined; onChange: (color: string | undefined) => void; clearable: true }
    | { color: string; onChange: (color: string) => void; clearable?: false }
  ) & { className?: string }
> = ({ color, onChange, clearable, className }) => {
  const tooltipRef = useRef<TooltipAPI>(null);

  return (
    <Tooltip ref={tooltipRef} attachment="top middle" targetAttachment="bottom middle" targetClassName={className}>
      <button type="button" className="btn disc border border-secondary" style={{ background: color || "#ffffff" }}>
        <span style={{ color: "transparent" }}>X</span>
      </button>
      <div className="custom-color-picker">
        <SketchPicker
          color={color ? hexToRgba(color) : undefined}
          onChange={(color) => onChange(rgbaToHex(color.rgb))}
          styles={{
            default: {
              picker: {
                boxShadow: "none",
                padding: 0,
              },
            },
          }}
        />
        <div className="text-end">
          {clearable && (
            <button className="btn btn-sm btn-outline-dark ms-2" onClick={() => onChange(undefined)}>
              <AiOutlineClose />
            </button>
          )}
          <button className="btn btn-sm btn-primary ms-2" onClick={() => tooltipRef.current?.close()}>
            <AiOutlineCheck />
          </button>
        </div>
      </div>
    </Tooltip>
  );
};

export default ColorPicker;

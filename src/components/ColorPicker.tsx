import { FC, useRef } from "react";
import { SketchPicker } from "react-color";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

import Tooltip, { TooltipAPI } from "./Tooltip";

const ColorPicker: FC<
  | { color: string | undefined; onChange: (color: string | undefined) => void; clearable: true }
  | { color: string; onChange: (color: string) => void; clearable?: false }
> = ({ color, onChange, clearable }) => {
  const tooltipRef = useRef<TooltipAPI>(null);

  return (
    <Tooltip ref={tooltipRef} attachment="top middle" targetAttachment="bottom middle">
      <button
        type="button"
        className="btn btn-sm btn-outline-dark d-inline-block h-100 rounded-pill"
        style={{ background: color || "#ffffff", width: "2.4em" }}
      >
        <span style={{ color: "transparent" }}>X</span>
      </button>
      <div className="custom-color-picker">
        <SketchPicker
          color={color}
          onChange={(color) => onChange(color.hex)}
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

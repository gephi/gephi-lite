import { FC } from "react";
import { SketchPicker } from "react-color";

import Tooltip from "./Tooltip";

const ColorPicker: FC<
  | { color: string | undefined; onChange: (color: string | undefined) => void; clearable: true }
  | { color: string; onChange: (color: string) => void; clearable?: false }
> = ({ color, onChange, clearable }) => {
  return (
    <Tooltip attachment="top middle" targetAttachment="bottom middle">
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
          onChangeComplete={(color) => {
            onChange(color.hex);
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
      </div>
    </Tooltip>
  );
};

export default ColorPicker;

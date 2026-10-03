import { FC } from "react";

import { CloseIcon } from "./common-icons";

/** Text input with a cross button to empty it. */
export const ClearableInput: FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearTitle: string;
  className?: string;
}> = ({ value, onChange, placeholder, clearTitle, className }) => {
  return (
    <div className={`position-relative ${className ?? ""}`}>
      <input
        type="text"
        className="form-control form-control-sm pe-5"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder ?? clearTitle}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
      />
      {value && (
        <button
          type="button"
          className="gl-btn gl-btn-icon position-absolute top-50 end-0 translate-middle-y"
          title={clearTitle}
          aria-label={clearTitle}
          onClick={() => onChange("")}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

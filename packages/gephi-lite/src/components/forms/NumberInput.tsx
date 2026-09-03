import { FC, useEffect, useRef } from "react";
import { PiMinus, PiPlus } from "react-icons/pi";

/**
 * A number input with explicit −/+ stepper buttons.
 *
 * We can't rely on the browser's native spin buttons: mobile browsers (Android, iOS) simply don't
 * render them, so a `type="number"` field has no visible way to increment/decrement there. The
 * native buttons are hidden via CSS (see `.gl-number-input` in `_forms.scss`) and replaced by these
 * buttons, so the stepper looks and behaves the same on every platform.
 */
export const NumberInput: FC<{
  value?: number;
  onChange: (value?: number) => void;
  id?: string;
  autoFocus?: boolean;
  placeholder?: string;
  step?: number;
}> = ({ value, onChange, id, autoFocus, placeholder, step = 1 }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && autoFocus) ref.current.focus();
  }, [autoFocus]);

  const bump = (delta: number) => onChange((typeof value === "number" ? value : 0) + delta);

  return (
    <div className="input-group gl-number-input">
      <button
        type="button"
        tabIndex={-1}
        className="gl-btn gl-btn-outline gl-btn-icon"
        aria-label="decrement"
        onClick={() => bump(-step)}
      >
        <PiMinus />
      </button>
      <input
        id={id}
        ref={ref}
        className="form-control text-center"
        type="number"
        autoComplete="off"
        value={value ?? ""}
        step="any"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value ? +e.target.value : undefined)}
      />
      <button
        type="button"
        tabIndex={-1}
        className="gl-btn gl-btn-outline gl-btn-icon"
        aria-label="increment"
        onClick={() => bump(step)}
      >
        <PiPlus />
      </button>
    </div>
  );
};

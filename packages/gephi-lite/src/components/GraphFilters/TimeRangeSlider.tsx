import { DateTime } from "luxon";
import { FC, useCallback, useEffect, useRef, useState } from "react";

interface TimeRangeSliderProps {
  min: Date;
  max: Date;
  value: [Date, Date];
  onChange: (range: [Date, Date]) => void;
  onCommit?: (range: [Date, Date]) => void;
  step?: number; // milliseconds, defaults to 1 day
  disabled?: boolean;
  formatLabel?: (date: Date) => string;
  marks?: Record<number, string>;
}

type DragMode = "min" | "max" | "range" | null;

export const TimeRangeSlider: FC<TimeRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  onCommit,
  step = 24 * 60 * 60 * 1000, // 1 day default
  disabled = false,
  formatLabel,
  marks,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValues, setDragStartValues] = useState<[number, number]>([0, 0]);
  const [focusedThumb, setFocusedThumb] = useState<"min" | "max" | null>(null);

  const minTime = min.getTime();
  const maxTime = max.getTime();
  const totalDuration = maxTime - minTime;

  const [minValue, maxValue] = value;
  const minValueTime = minValue.getTime();
  const maxValueTime = maxValue.getTime();

  // Calculate positions as percentages
  const minPosition = ((minValueTime - minTime) / totalDuration) * 100;
  const maxPosition = ((maxValueTime - minTime) / totalDuration) * 100;

  const formatDate = useCallback(
    (date: Date) => {
      if (formatLabel) return formatLabel(date);
      return DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");
    },
    [formatLabel],
  );

  const snapToStep = useCallback(
    (time: number) => {
      const stepsFromMin = Math.round((time - minTime) / step);
      return Math.max(minTime, Math.min(maxTime, minTime + stepsFromMin * step));
    },
    [minTime, maxTime, step],
  );

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!railRef.current) return minTime;
      const rect = railRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = minTime + percentage * totalDuration;
      return snapToStep(time);
    },
    [minTime, totalDuration, snapToStep],
  );

  const handleMouseDown = useCallback(
    (mode: DragMode, e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragMode(mode);
      setDragStartX(e.clientX);
      setDragStartValues([minValueTime, maxValueTime]);
    },
    [disabled, minValueTime, maxValueTime],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragMode || !railRef.current) return;

      const rect = railRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / rect.width) * totalDuration;
      const [startMin, startMax] = dragStartValues;

      let newMinTime: number;
      let newMaxTime: number;

      if (dragMode === "min") {
        newMinTime = snapToStep(startMin + deltaTime);
        newMinTime = Math.max(minTime, Math.min(newMinTime, startMax - step));
        newMaxTime = maxValueTime;
      } else if (dragMode === "max") {
        newMaxTime = snapToStep(startMax + deltaTime);
        newMaxTime = Math.max(startMin + step, Math.min(newMaxTime, maxTime));
        newMinTime = minValueTime;
      } else if (dragMode === "range") {
        const rangeDuration = startMax - startMin;
        newMinTime = snapToStep(startMin + deltaTime);
        newMaxTime = newMinTime + rangeDuration;

        // Keep range within bounds
        if (newMinTime < minTime) {
          newMinTime = minTime;
          newMaxTime = minTime + rangeDuration;
        }
        if (newMaxTime > maxTime) {
          newMaxTime = maxTime;
          newMinTime = maxTime - rangeDuration;
        }
      } else {
        return;
      }

      onChange([new Date(newMinTime), new Date(newMaxTime)]);
    },
    [
      dragMode,
      dragStartX,
      dragStartValues,
      totalDuration,
      snapToStep,
      minTime,
      maxTime,
      step,
      onChange,
      minValueTime,
      maxValueTime,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (dragMode && onCommit) {
      onCommit([minValue, maxValue]);
    }
    setDragMode(null);
  }, [dragMode, minValue, maxValue, onCommit]);

  useEffect(() => {
    if (dragMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);

  const handleKeyDown = useCallback(
    (thumb: "min" | "max", e: React.KeyboardEvent) => {
      if (disabled) return;

      const isShiftPressed = e.shiftKey;
      let handled = false;

      if (isShiftPressed) {
        // Shift + Arrow: Pan the range
        const rangeDuration = maxValueTime - minValueTime;
        let newMinTime = minValueTime;
        let newMaxTime = maxValueTime;

        if (e.key === "ArrowRight") {
          newMinTime = Math.min(minValueTime + step, maxTime - rangeDuration);
          newMaxTime = newMinTime + rangeDuration;
          handled = true;
        } else if (e.key === "ArrowLeft") {
          newMinTime = Math.max(minValueTime - step, minTime);
          newMaxTime = newMinTime + rangeDuration;
          handled = true;
        }

        if (handled) {
          onChange([new Date(newMinTime), new Date(newMaxTime)]);
          if (onCommit) onCommit([new Date(newMinTime), new Date(newMaxTime)]);
        }
      } else {
        // Arrow: Resize the range
        if (thumb === "min") {
          if (e.key === "ArrowRight") {
            const newMinTime = Math.min(minValueTime + step, maxValueTime - step);
            onChange([new Date(newMinTime), maxValue]);
            if (onCommit) onCommit([new Date(newMinTime), maxValue]);
            handled = true;
          } else if (e.key === "ArrowLeft") {
            const newMinTime = Math.max(minValueTime - step, minTime);
            onChange([new Date(newMinTime), maxValue]);
            if (onCommit) onCommit([new Date(newMinTime), maxValue]);
            handled = true;
          }
        } else {
          if (e.key === "ArrowRight") {
            const newMaxTime = Math.min(maxValueTime + step, maxTime);
            onChange([minValue, new Date(newMaxTime)]);
            if (onCommit) onCommit([minValue, new Date(newMaxTime)]);
            handled = true;
          } else if (e.key === "ArrowLeft") {
            const newMaxTime = Math.max(maxValueTime - step, minValueTime + step);
            onChange([minValue, new Date(newMaxTime)]);
            if (onCommit) onCommit([minValue, new Date(newMaxTime)]);
            handled = true;
          }
        }
      }

      if (handled) {
        e.preventDefault();
      }
    },
    [disabled, minValueTime, maxValueTime, step, minTime, maxTime, minValue, maxValue, onChange, onCommit],
  );

  const handleRailClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || dragMode) return;
      const clickedTime = getTimeFromPosition(e.clientX);
      const rangeCenter = (minValueTime + maxValueTime) / 2;

      if (clickedTime < rangeCenter) {
        // Click before range: move min thumb
        const newMinTime = Math.max(minTime, Math.min(clickedTime, maxValueTime - step));
        onChange([new Date(newMinTime), maxValue]);
        if (onCommit) onCommit([new Date(newMinTime), maxValue]);
      } else {
        // Click after range: move max thumb
        const newMaxTime = Math.max(minValueTime + step, Math.min(clickedTime, maxTime));
        onChange([minValue, new Date(newMaxTime)]);
        if (onCommit) onCommit([minValue, new Date(newMaxTime)]);
      }
    },
    [
      disabled,
      dragMode,
      getTimeFromPosition,
      minValueTime,
      maxValueTime,
      minTime,
      maxTime,
      step,
      minValue,
      maxValue,
      onChange,
      onCommit,
    ],
  );

  return (
    <div className="time-range-slider" style={{ padding: "20px 0", userSelect: "none" }}>
      {/* Rail */}
      <div
        ref={railRef}
        onClick={handleRailClick}
        style={{
          position: "relative",
          height: "6px",
          backgroundColor: "#e0e0e0",
          borderRadius: "3px",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        role="group"
        aria-label="Time range slider"
      >
        {/* Track (selected range) */}
        <div
          onMouseDown={(e) => handleMouseDown("range", e)}
          style={{
            position: "absolute",
            left: `${minPosition}%`,
            right: `${100 - maxPosition}%`,
            height: "100%",
            backgroundColor: disabled ? "#ccc" : "#000",
            borderRadius: "3px",
            cursor: disabled ? "not-allowed" : dragMode === "range" ? "grabbing" : "grab",
          }}
          role="presentation"
        />

        {/* Min Thumb */}
        <div
          onMouseDown={(e) => handleMouseDown("min", e)}
          onKeyDown={(e) => handleKeyDown("min", e)}
          onFocus={() => setFocusedThumb("min")}
          onBlur={() => setFocusedThumb(null)}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={minTime}
          aria-valuemax={maxTime}
          aria-valuenow={minValueTime}
          aria-valuetext={formatDate(minValue)}
          aria-label="Minimum date"
          aria-disabled={disabled}
          style={{
            position: "absolute",
            left: `${minPosition}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "20px",
            backgroundColor: disabled ? "#999" : "#000",
            borderRadius: "50%",
            border: focusedThumb === "min" ? "2px solid #0066cc" : "2px solid #fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            cursor: disabled ? "not-allowed" : dragMode === "min" ? "grabbing" : "grab",
            zIndex: 2,
          }}
        />

        {/* Max Thumb */}
        <div
          onMouseDown={(e) => handleMouseDown("max", e)}
          onKeyDown={(e) => handleKeyDown("max", e)}
          onFocus={() => setFocusedThumb("max")}
          onBlur={() => setFocusedThumb(null)}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={minTime}
          aria-valuemax={maxTime}
          aria-valuenow={maxValueTime}
          aria-valuetext={formatDate(maxValue)}
          aria-label="Maximum date"
          aria-disabled={disabled}
          style={{
            position: "absolute",
            left: `${maxPosition}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "20px",
            backgroundColor: disabled ? "#999" : "#000",
            borderRadius: "50%",
            border: focusedThumb === "max" ? "2px solid #0066cc" : "2px solid #fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            cursor: disabled ? "not-allowed" : dragMode === "max" ? "grabbing" : "grab",
            zIndex: 2,
          }}
        />

        {/* Tick marks */}
        {marks &&
          Object.entries(marks).map(([time, label]) => {
            const timeNum = Number(time);
            const position = ((timeNum - minTime) / totalDuration) * 100;
            return (
              <div
                key={time}
                style={{
                  position: "absolute",
                  left: `${position}%`,
                  top: "100%",
                  transform: "translateX(-50%)",
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#666",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            );
          })}
      </div>

      {/* Value labels */}
      <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <div>
          <strong>From:</strong> {formatDate(minValue)}
        </div>
        <div>
          <strong>To:</strong> {formatDate(maxValue)}
        </div>
      </div>

      {/* Instructions */}
      {focusedThumb && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
          Arrow keys: resize range • Shift + Arrow keys: pan range
        </div>
      )}
    </div>
  );
};

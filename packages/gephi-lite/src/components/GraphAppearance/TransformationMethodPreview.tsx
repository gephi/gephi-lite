import { range } from "lodash";
import { FC } from "react";

import { TransformationMethod } from "../../core/appearance/types";
import { makeTransformValue } from "../../core/appearance/utils";

export const TransformationMethodPreview: FC<{ method?: TransformationMethod }> = ({ method }) => {
  const getValue = makeTransformValue(method);
  const size = 30;
  const margin = 2;
  return (
    <>
      <svg
        viewBox={`${-margin} ${margin} ${size + margin} ${size - margin}`}
        xmlns="http://www.w3.org/2000/svg"
        height={`${size}px`}
        width={`${size}px`}
        style={{ flexShrink: 0, backgroundColor: "lightgray" }}
      >
        {/* Example of a polyline with the default fill */}
        <polyline
          fill="none"
          stroke="black"
          strokeWidth={2}
          points={range(0.1, size)
            .map(
              (n) =>
                `${n},${
                  size -
                  (((getValue(n) || 1) - (getValue(0.1) || 1)) * size) / ((getValue(size) || 1) - (getValue(0.1) || 1))
                }`,
            )
            .join(" ")}
        />
      </svg>
    </>
  );
};

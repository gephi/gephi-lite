export const MIN_LABEL_THRESHOLD = 0.1;
export const MAX_LABEL_THRESHOLD = 10;

export function stateToInputThreshold(v: number): number {
  if (v === Infinity) return MIN_LABEL_THRESHOLD;
  if (v === 0) return MAX_LABEL_THRESHOLD;
  return 6 / v;
}

export function inputToStateThreshold(v: number): number {
  if (v <= MIN_LABEL_THRESHOLD) return Infinity;
  if (v >= MAX_LABEL_THRESHOLD) return 0;
  return 6 / v;
}

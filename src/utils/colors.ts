import chroma from "chroma-js";
import { memoize } from "lodash";

export const memoizedBrighten = memoize((color: string) => chroma.mix(color, "white", 0.75).hex());
export const memoizedDarken = memoize((color: string) => chroma.mix(color, "black", 0.75).hex());

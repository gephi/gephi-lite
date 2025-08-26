import { gephiLiteParse, gephiLiteStringify } from "../utils";
import { FiltersState } from "./types";

export * from "./types";

/**
 * Returns an empty filters state:
 */
export function getEmptyFiltersState(): FiltersState {
  return {
    filters: [],
  };
}

/**
 * Filters lifecycle helpers (state serialization / deserialization):
 */
export function serializeFiltersState(filters: FiltersState): string {
  return gephiLiteStringify(filters);
}
export function parseFiltersState(rawFilters: string): FiltersState | null {
  try {
    // TODO:
    // Validate the actual data
    return gephiLiteParse(rawFilters);
  } catch (e) {
    console.error(e);
    return null;
  }
}

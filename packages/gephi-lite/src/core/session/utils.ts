import { parseWithSetsAndFunctions, stringifyWithSetsAndFunctions } from "@gephi/gephi-lite-sdk";

import { Session } from "./types";

export function getEmptySession(): Session {
  return {
    layoutsParameters: {},
    metrics: {},
  };
}

/**
 * Preferences lifecycle helpers (state serialization / deserialization):
 */
export function serializeSession(session: Session): string {
  return stringifyWithSetsAndFunctions(session);
}

export function parseSession(rawSession: string): Session | null {
  try {
    // Validate the actual data
    return parseWithSetsAndFunctions(rawSession);
  } catch (e) {
    return null;
  }
}

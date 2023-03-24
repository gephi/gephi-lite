import { parse, stringify } from "../utils/json";
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
  return stringify(session);
}

export function parseSession(rawSession: string): Session | null {
  try {
    // Validate the actual data
    return parse(rawSession);
  } catch (e) {
    return null;
  }
}

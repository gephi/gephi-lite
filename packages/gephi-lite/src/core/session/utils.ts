import { gephiLiteParse, gephiLiteStringify } from "@gephi/gephi-lite-sdk";

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
  return gephiLiteStringify(session);
}

export function parseSession(rawSession: string): Session | null {
  try {
    // Validate the actual data
    return gephiLiteParse(rawSession);
  } catch (e) {
    console.error(e);
    return null;
  }
}

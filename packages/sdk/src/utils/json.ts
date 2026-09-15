import Graph from "graphology";
import { SerializedGraph } from "graphology-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deserializer(_: string, value: any): any {
  if (Array.isArray(value) && value.length === 3 && value[0] === "<<SET" && value[2] === "SET>>") {
    return new Set(gephiLiteParse(value[1]));
  }
  if (Array.isArray(value) && value.length === 3 && value[0] === "<<Function" && value[2] === "Function>>") {
    return new Function(`return ${value[1]}`)();
  }
  // A serialized graphology graph always lists its nodes and edges as arrays. Checking the types
  // and not just the key names matters: plenty of states are keyed by item type (`{ nodes: ...,
  // edges: ... }`), and treating one of those as a graph makes `Graph.from` throw, which silently
  // discards the whole document being parsed.
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as SerializedGraph).nodes) &&
    Array.isArray((value as SerializedGraph).edges)
  ) {
    return Graph.from(value as SerializedGraph);
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializer(_: string, value: unknown): any {
  if (value instanceof Set) {
    return ["<<SET", gephiLiteStringify(Array.from(value)), "SET>>"];
  }
  if (value instanceof Function) {
    return ["<<Function", value.toString(), "Function>>"];
  }
  return value;
}

/**
 * Use the following functions to serialize/deserialize data structures that may
 * include Sets, serializable functions & graph.
 */
export function gephiLiteStringify(value: unknown): string {
  return JSON.stringify(value, serializer);
}

/**
 * Deserialize JSON data in JS, using custom reviver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gephiLiteParse<T = any>(value: string): T {
  return JSON.parse(value, deserializer) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializer(_: string, value: any): any {
  if (Array.isArray(value) && value.length === 3 && value[0] === "<<SET" && value[2] === "SET>>") {
    return new Set(parseWithSetsAndFunctions(value[1]));
  }
  if (Array.isArray(value) && value.length === 3 && value[0] === "<<Function" && value[2] === "Function>>") {
    // eslint-disable-next-line no-new-func
    return new Function(`return ${value[1]}`)();
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializer(_: string, value: unknown): any {
  if (value instanceof Set) {
    return ["<<SET", stringifyWithSetsAndFunctions(Array.from(value)), "SET>>"];
  }
  if (value instanceof Function) {
    return ["<<Function", value.toString(), "Function>>"];
  }
  return value;
}

/**
 * Use the following functions to serialize/deserialize data structures that may
 * include Sets and serializable functions:
 */
export function stringifyWithSetsAndFunctions(value: unknown): string {
  return JSON.stringify(value, serializer);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWithSetsAndFunctions<T = any>(value: string): T {
  return JSON.parse(value, deserializer) as T;
}

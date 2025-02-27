import { Scalar } from "@gephi/gephi-lite-sdk";
import checkIsUrl from "is-url";
import { isNil } from "lodash";

const NON_NIL_SCALAR_TYPES = new Set(["boolean", "number", "string"]);

/**
 * Check if a value is a scalar value.
 */
export function isScalar(value: unknown): value is Scalar {
  return isNil(value) || NON_NIL_SCALAR_TYPES.has(typeof value);
}

/**
 * Check if a string is a valid url.
 */
export function isUrl(url: string): boolean {
  return checkIsUrl(url);
}

/**
 * Check if the given filename has the specified extension.
 * Exemple `checkFilenameExtension(file.filename, "gexf")`
 */
export function checkFilenameExtension(filename: string, extension: string): boolean {
  const fileExt = filename.split(".").pop()?.toLocaleLowerCase() || "";
  return extension.toLocaleLowerCase() === fileExt;
}

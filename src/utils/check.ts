import checkIsUrl from "is-url";

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

/**
 * Given an url, returns the filename
 */
export function extractFilename(url: string): string {
  return url.split("/").pop() || url;
}

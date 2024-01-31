import checkIsUrl from "is-url";

/**
 * Check if a string is a valid url.
 */
export function isUrl(url: string): boolean {
  return checkIsUrl(url);
}

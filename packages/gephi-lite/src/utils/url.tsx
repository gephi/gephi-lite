import { Props as LinkifyProps } from "react-linkify";

import { normalizeURL, prettifyURL } from "./linkify";

/**
 * Given an url, returns the filename
 */
export function extractFilename(url: string): string {
  return url.split("/").pop() || url;
}
/**
 * Configuration of Linkify
 * Given a string, return a proper a href if this string is a URL
 */
export const DEFAULT_LINKIFY_PROPS: Partial<LinkifyProps> = {
  textDecorator: (url: string) => prettifyURL(url),
  hrefDecorator: (url: string) => normalizeURL(url) || url,
  componentDecorator: (decoratedHref: string, decoratedText: string, key: number) => (
    <a key={key} href={decoratedHref} target="_blank" rel="noreferrer">
      {decoratedText}
    </a>
  ),
};

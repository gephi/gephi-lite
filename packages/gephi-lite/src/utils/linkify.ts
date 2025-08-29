import LinkifyIt from "linkify-it";
import tlds from "tlds";

const linkify = new LinkifyIt()
  .tlds(tlds) // Reload with full tlds list
  .tlds("onion", true) // Add unofficial `.onion` domain
  .add("git:", "http:") // Add `git:` protocol as "alias"
  .set({ fuzzyIP: true }); // Enable IPs in fuzzy links (without schema);

export default linkify;

export function normalizeURL(url: string): string | undefined {
  const trimedUrl = url.trim();

  const matchAtStart = linkify.matchAtStart(trimedUrl);
  if (matchAtStart) return matchAtStart.url;

  // Check for full fuzzy strings
  if (linkify.pretest(trimedUrl)) {
    const matches = linkify.match(trimedUrl);
    if (matches?.length && matches[0].text === trimedUrl) return matches[0].url;
  }

  return undefined;
}

export function prettifyURL(url: string): string {
  const match = linkify.matchAtStart(url);
  return (match ? match.text : url).replace(/^https?:\/\//, "");
}

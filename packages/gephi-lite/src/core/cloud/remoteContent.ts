/**
 * Fingerprint of a remote file's content.
 *
 * The freshness guard cannot rely on the remote's `updated_at` alone: a gist's timestamp moves for
 * reasons that leave the file untouched (a star, a fork, a comment, or two reads of the same
 * version simply disagreeing), and warning on the timestamp alone turns any of those into an
 * alarming "someone changed your file" modal in the middle of an editing session. So the guard
 * compares the remote's content against the fingerprint of what we last synced (see
 * `remoteContentFingerprint` in the file state): only genuinely different bytes count as a change.
 *
 * FNV-1a over the content, prefixed by its length. Not a cryptographic hash: this only has to tell
 * "same bytes" from "different bytes", cheaply and without keeping a whole graph file around.
 */
export function fingerprintContent(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${content.length}:${(hash >>> 0).toString(16)}`;
}

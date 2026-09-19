import { config } from "../config";

function getPrefixedKey(key: string) {
  return `${config.version.major}.${config.version.minor}_${key}`;
}
export const localStorage = {
  getItem: (key: string): string | null => window.localStorage.getItem(getPrefixedKey(key)),
  setItem: (key: string, data: string): void => window.localStorage.setItem(getPrefixedKey(key), data),
  removeItem: (key: string): void => window.localStorage.removeItem(getPrefixedKey(key)),
};

export const sessionStorage = {
  getItem: (key: string): string | null => window.sessionStorage.getItem(getPrefixedKey(key)),
  setItem: (key: string, data: string): void => window.sessionStorage.setItem(getPrefixedKey(key), data),
  removeItem: (key: string): void => window.sessionStorage.removeItem(getPrefixedKey(key)),
};

/**
 * Per-tab workspace storage (graph dataset, filters, appearance, session).
 *
 * These have to survive a page reload without leaking from one tab to another, which is exactly
 * what `sessionStorage` gives - except when the browser *discards* a background tab to reclaim
 * memory and restores it later (Firefox Android does this on a tab left open overnight). The tab's
 * sessionStorage is then only brought back if it is small enough for the browser's session store,
 * and a serialized graph is orders of magnitude too big for that: the tab used to come back empty,
 * showing the welcome modal as if nothing had ever been loaded, and the graph was lost.
 *
 * So the snapshot lives in `localStorage`, which the browser restores whatever its size, namespaced
 * by a per-tab id so tabs stay independent. Only that id (a few dozen bytes) stays in
 * `sessionStorage`, small enough to always make it through a tab restore; it is mirrored in
 * `history.state`, restored as well, so the tab is still recognized if sessionStorage is dropped
 * altogether.
 *
 * Since localStorage outlives the tab that wrote it, namespaces are garbage collected: those left
 * by tabs long gone are dropped at startup, and hitting the quota evicts the least recently used
 * ones (see `setItem` below).
 */
const TAB_ID_KEY = "tabId";
const TAB_NAMESPACE = "tab:";
const TAB_UPDATED_AT_KEY = "updatedAt";
const HISTORY_TAB_ID_KEY = "gephiLiteTabId";
// Matches any tab-namespaced key, whichever app version wrote it: "<major>.<minor>_tab:<id>:<key>".
const TAB_KEY_PATTERN = /^\d+\.\d+_tab:([^:]+):(.+)$/;
// A namespace nothing has written to for this long belongs to a tab that will never come back.
const TAB_STATE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function createTabId(): string {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getHistoryTabId(): string | null {
  const state = window.history.state as Record<string, unknown> | null;
  const id = state ? state[HISTORY_TAB_ID_KEY] : null;
  return typeof id === "string" ? id : null;
}

let tabId: string | null = null;
function getTabId(): string {
  if (tabId) return tabId;

  // history.state comes first: it is restored with the tab even when sessionStorage is not.
  tabId = getHistoryTabId() || sessionStorage.getItem(TAB_ID_KEY) || createTabId();
  try {
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  } catch (_e) {
    // Storage disabled (private mode...): the id then only lives in memory and history.state.
  }
  if (getHistoryTabId() !== tabId) {
    const state = window.history.state;
    window.history.replaceState({ ...(state || {}), [HISTORY_TAB_ID_KEY]: tabId }, "");
  }
  return tabId;
}

/**
 * Adds this tab's id to a history state object. Every pushState/replaceState the app makes must go
 * through it, otherwise it would drop the id from the entry the browser restores (see above).
 */
export function tagHistoryState(state?: Record<string, unknown>): Record<string, unknown> {
  return { ...(state || {}), [HISTORY_TAB_ID_KEY]: getTabId() };
}

function tabKey(key: string): string {
  return `${TAB_NAMESPACE}${getTabId()}:${key}`;
}

/** Every tab namespace currently in localStorage, with its keys and last write date. */
function getTabNamespaces(): { id: string; keys: string[]; updatedAt: number }[] {
  const namespaces: Record<string, { id: string; keys: string[]; updatedAt: number }> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    const match = key && key.match(TAB_KEY_PATTERN);
    if (!key || !match) continue;

    const [, id, name] = match;
    const namespace = (namespaces[id] = namespaces[id] || { id, keys: [], updatedAt: 0 });
    namespace.keys.push(key);
    if (name === TAB_UPDATED_AT_KEY) namespace.updatedAt = Number(window.localStorage.getItem(key)) || 0;
  }
  return Object.values(namespaces);
}

function removeTabNamespace(keys: string[]): void {
  keys.forEach((key) => window.localStorage.removeItem(key));
}

/** Drops the snapshots left by tabs that are gone for good. Called once at startup. */
export function pruneStaleTabStorage(): void {
  try {
    const now = Date.now();
    getTabNamespaces().forEach(({ id, keys, updatedAt }) => {
      if (id !== getTabId() && now - updatedAt > TAB_STATE_MAX_AGE) removeTabNamespace(keys);
    });
  } catch (_e) {
    // Housekeeping only: never let it break the application startup.
  }
}

/** Frees room by dropping the least recently used other tab. False when there is none left. */
function evictLeastRecentlyUsedTab(): boolean {
  const others = getTabNamespaces().filter(({ id }) => id !== getTabId());
  if (!others.length) return false;

  const oldest = others.reduce((a, b) => (a.updatedAt <= b.updatedAt ? a : b));
  removeTabNamespace(oldest.keys);
  return true;
}

export const tabStorage = {
  getItem: (key: string): string | null => {
    const value = localStorage.getItem(tabKey(key));
    // Fallback for a tab opened before this version, whose snapshot is still in sessionStorage:
    return value !== null ? value : sessionStorage.getItem(key);
  },
  setItem: (key: string, data: string): void => {
    const write = () => {
      localStorage.setItem(tabKey(key), data);
      localStorage.setItem(tabKey(TAB_UPDATED_AT_KEY), String(Date.now()));
    };
    try {
      write();
      return;
    } catch (_e) {
      // Quota reached, handled below.
    }
    // Make room by forgetting the other tabs, least recently used first:
    while (evictLeastRecentlyUsedTab()) {
      try {
        write();
        return;
      } catch (_e) {
        // Still not enough room, keep evicting.
      }
    }
    // Nothing more to free: drop our own entry rather than keeping an outdated snapshot, which
    // would then be restored in place of the current graph on the next reload.
    tabStorage.removeItem(key);
  },
  removeItem: (key: string): void => localStorage.removeItem(tabKey(key)),
};

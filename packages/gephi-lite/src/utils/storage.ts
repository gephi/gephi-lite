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

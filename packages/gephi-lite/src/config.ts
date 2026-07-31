import { parse } from "semver";

import { version } from "../package.json";

// __GIT_COMMIT_HASH__/__BUILD_DATE__ are replaced at build time (see vite.config.mts) wherever
// Vite actually transforms this module for the browser bundle. Some non-browser transform paths
// (namely vitest running tests in Node rather than in a real browser) skip that substitution, in
// which case the bare identifier would throw a ReferenceError as soon as this module is evaluated;
// `typeof` guards against that without needing "unused expression" workarounds.
const gitCommitHash = typeof __GIT_COMMIT_HASH__ !== "undefined" ? __GIT_COMMIT_HASH__ : null;
const buildDate = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : null;

export const config = {
  version: parse(version)!,
  // null both in an environment with no git checkout to read from (a source tarball, some Docker
  // builds...) and wherever the build-time substitution above did not happen.
  gitCommitHash,
  buildDate,
  website_url: "https://github.com/gephi/gephi-lite#readme",
  notificationTimeoutMs: 3000,
  github_proxy: import.meta.env.VITE_GITHUB_PROXY || "/_github",
  github: {
    client_id: "938f561199e6e55c739b",
    scopes: ["gist"],
  },
  matomo: {
    urlBase: import.meta.env.VITE_MATOMO_URL,
    siteId: import.meta.env.VITE_MATOMO_SITEID || 0,
    heartBeat: {
      active: true,
      seconds: 15,
    },
    configurations: {
      disableCookies: true,
      setSecureCookie: true,
      setRequestMethod: "POST",
    },
  },
};

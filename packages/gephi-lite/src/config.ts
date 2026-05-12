import { version } from "../package.json";

export const config = {
  version,
  website_url: "https://github.com/gephi/gephi-lite#readme",
  notificationTimeoutMs: 3000,
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

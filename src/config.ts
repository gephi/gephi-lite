export const config = {
  githubAppId: "Iv1.28614c853d9bb64a",
  notificationTimeoutMs: 3000,
  openid: {
    common: {
      client_id: "interactive.public.short",
      redirect_uri: window.location.origin + "/authentication/callback",
      silent_redirect_uri:
        window.location.origin + "/authentication/silent-callback",
      service_worker_relative_url: "/OidcServiceWorker.js",
      service_worker_only: false,
    },
    github: {
      client_id: "938f561199e6e55c739b",
      scope: "opend profile gist",
      authority: "https://github.com/",
    },
  },
};

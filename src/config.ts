export const config = {
  website_url: "https://github.com/gephi/gephi-lite#readme",
  notificationTimeoutMs: 3000,
  github_proxy: process.env.REACT_APP_GITHUB_PROXY || "/_github",
  github: {
    client_id: "938f561199e6e55c739b",
    scopes: ["gist"],
  },
};

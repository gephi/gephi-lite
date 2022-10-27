const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/_github/*",
    createProxyMiddleware({
      target: "https://github.com/",
      changeOrigin: true,
      pathRewrite: {
        "^/_github/": "/",
      },
    }),
  );
};

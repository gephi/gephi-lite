const config = require("./i18next-scanner.dev.config.ts");

module.exports = {
  options: {
    ...config.options,
    lngs: ["en", "fr"],
    debug: false,
  },
};

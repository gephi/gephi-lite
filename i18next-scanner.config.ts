module.exports = {
  options: {
    debug: true,
    // read strings from functions: IllegalMoveError('KEY') or t('KEY')
    func: {
      list: ["t"],
      extensions: [".ts", ".tsx"],
    },

    // Create and update files `en.json`, `fr.json`, `es.json`
    lngs: ["dev"],
    defaultLng: "dev",

    // Put a blank string as initial translation
    // (useful for Weblate be marked as 'not yet translated', see later)
    defaultValue: (lng, ns, key) => "",

    // Location of translation files
    resource: {
      loadPath: "src/locales/{{lng}}.json",
      savePath: "src/locales/{{lng}}.json",
      jsonIndent: 2,
    },

    nsSeparator: ":",
    keySeparator: ".",
  },
};

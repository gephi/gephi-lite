# Gephi Lite - Changelog:

### 0.4.1

Correcting some regressions:

- End to End tests were not run in CI
- gexf= url params is back for retro-compatibility but with a deprecation warning
- End to End tests updated
- code version displayed in welcome modal

## 0.4.0 version aka FOSDEM 2024

This version has been developed in a one week iteration preceding the FOSDEM 2024 conference where we presented the [genesis of Gephi Lite](https://fosdem.org/2024/schedule/event/fosdem-2024-3253-bridging-research-and-open-source-the-genesis-of-gephi-lite/).

### New features

- New language Hungarian 🇭🇺 thanks to Lajos Kékesi [@ludvig55](https://github.com/ludvig55/)
- New language Korean 🇰🇷 thanks to Hoil KIM [@hiikiim](https://hosted.weblate.org/user/hiikiim/)
- Attributes values which are URL are rendered as hyperlinks in node panel
- Import GraphML format
- Graph background color can be changed
- An image (URL in node attribute) can be used as node background

### Enhancements

- Better node/edge edition user experience:
  - Validation message
  - Ids are optional
  - Graph model is used to guide edition
  - Attributes in graph model can be deleted
- Better UX in Range filter (tick label + bounds inclusion)
- Caption size adjustments
- Added error boundaries with special error page
- Added a "open an empty graph" button

### Debug

- [#52](https://github.com/gephi/gephi-lite/issues/52): custom metrics can output qualitative attribute
- [#115](https://github.com/gephi/gephi-lite/issues/115): add missing nodes at import option
- [#116](https://github.com/gephi/gephi-lite/issues/116): cancel custom filter crash
- [#117](https://github.com/gephi/gephi-lite/issues/117): graph model is modified if new attributes are created
- [#128](https://github.com/gephi/gephi-lite/issues/128): clear graph issue
- [#132](https://github.com/gephi/gephi-lite/issues/132): layout state issue
- [#136](https://github.com/gephi/gephi-lite/issues/136): technical attributes are now accessible in custom scripts

### QA

- Migrated from Create React App to Vite
- Upgrade dependencies including sigma v3
- Better CI cache management
- Various code refactoring around the central app state

## 0.3.0

### New features

- Nodes and edges sizes and colors caption
- Search in graph for nodes and edges
- Create/update/delete nodes and edges
- Oriented graphs support

### UX refinements

- General performance boost (notably the big lag after FA2 stop on big graph has been solved)
- Same color picker everywhere
- Better UX in statistics and layout notifications
- Better node/edges highlight on hover and selection
- Better node/edge selection
- Button to use FA2 infer settings

### QA

- Some unit tests
- Some e2e tests
- i18n in weblate system

### Debug

- Color partition on edge
- Edges size rendering
- Show edge toggle button

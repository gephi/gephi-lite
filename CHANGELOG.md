# Gephi Lite - Changelog:

## 1.0.0 aka "we're proud of it"

This version results from the user research made by the UX designer Arthur Desaintjan with the OuestWare team.
The User Interface has been totally revamped following the results of a users interview campaign.
Learn more on the design process in this [blog post](https://www.ouestware.com/2025/07/31/gephi-lite-new-design-en/).

### New features

- **Enhanced User Interfaces**: new minimalist graphic style, enhancement of the main menu, filters interface simplified...
- The graph data can be explored in node/edge **data table** just like the Gephi data laboratory
- Node/edge attribute **new data model** (new types: category, number, keywords, text, date, url, color, boolean)
- Use Gephi lite on your **phone or tablet**!
- New selections tool: **lasso selection**. Selection tools were hidden behind keyboard shortcuts, they now have their own buttons.

## 0.6.0 version aka FOSDEM 2025

This version has been developed in a one-week iteration organized at the [2025 Gephi Lite sprint](https://www.ouestware.com/2025/02/10/gephi-lite-0-6-en/), right before FOSDEM 2025.

### New features

- Possibility to use nodes degrees as a **dynamic attribute** along normal attributes in various places
- New visual variables: **Edges depth**, nodes/edges **color shading**
- New appearance option: **Crop node/edge labels** over N characters
- New button "**Select node neighbors**" in selected node options menu
- Gephi Lite **JSON file format**, to save/load graphs with their surrounding context (appearance, filters)
- The code structure has been refactored as a [monorepo](https://en.wikipedia.org/wiki/Monorepo)
- New **[`@gephi/gephi-lite-broadcast`](https://www.npmjs.com/package/@gephi/gephi-lite-broadcast)** TypeScript library, to drive Gephi Lite from other web applications
- New "**Clone graph in a new tab**" button
- **Topological filters**: _k_-core, ego networks and largest connected components
- Visualising ambiguity in Louvain community detection (experimental)

## 0.5.2

This version is just published to allow testing scripting Gephi Lite, using the [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) API.

## 0.5.1

various fixes:

- [#89](https://github.com/gephi/gephi-lite/issues/89): regression on show edges
- [#173](https://github.com/gephi/gephi-lite/issues/173): regression on performance due to layout metric
- boolean attributes not rendered correctly in terms Filter

Thanks to [@splines](https://github.com/Splines) for the bug reports

misc:

- upgrade Graphology Gexf to 0.13.2

## 0.5.0 version aka The 2024 Gephi week edition

This version has been developed in a one-week iteration organized at the [2024 Gephi week workshop](https://gephi.wordpress.com/2024/06/13/gephi-week-2024-peek-from-the-inside/).

Special thanks to [Anders Kristian Munk](https://github.com/akmunk), [Johan Irving Sølotft](https://github.com/Johansoltoft) and [Lasse Uhrskov Kristensen](https://github.com/watchforest) for testing the app and reporting ideas and issues.

### New features

- Dark mode
- Connected Closeness (experimental): in layout panel one can chose to compute and show the `Connected Closeness` metric. It provides a quality measure of the current layout [(jacomy 2023)](https://jgaa.info/index.php/jgaa/article/view/paper626). Note that the current implementation is still being tested and will most likely be updated.

### Enhancements

- Metrics can now indicate what kind of attributes they generate. We needed this to make sure that the Louvain Modularity was classified as a qualitative attribute although it outputs numbers.
- When creating an edge, the node select shows the last created nodes first to speed-up data edition experience. Thanks to [qkhanhpro](https://github.com/qkhanhpro) for reporting [this great idea](https://github.com/gephi/gephi-lite/issues/152)!
- Custom scripts modal now prevent data loss by warning users if script has not been saved before closing.
- Better User Experience in filters to avoid unwanted deletion
- Run your own [Gephi Lite instance through Docker](https://github.com/gephi/gephi-lite/#dockerfile-for-production)

### Debug

- [#160](https://github.com/gephi/gephi-lite/issues/160): Layout form input issues
- [#162](https://github.com/gephi/gephi-lite/issues/162): Graph metadata form issues
- [#153](https://github.com/gephi/gephi-lite/issues/153): Boolean attributes not rendered correctly in node panel
- [#148](https://github.com/gephi/gephi-lite/issues/148): Graph data model update issues

## 0.4.2

### Debug

- [#144](https://github.com/gephi/gephi-lite/issues/144): Fix github authentification

## 0.4.1

Correcting some regressions:

- End to End tests were not run in CI
- gexf= url params is back for retro-compatibility but with a deprecation warning
- End to End tests updated
- code version displayed in welcome modal

## 0.4.0 version aka FOSDEM 2024

This version has been developed in a one-week iteration preceding the FOSDEM 2024 conference where we presented the [genesis of Gephi Lite](https://fosdem.org/2024/schedule/event/fosdem-2024-3253-bridging-research-and-open-source-the-genesis-of-gephi-lite/).

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

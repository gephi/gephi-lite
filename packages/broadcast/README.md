# @gephi/gephi-lite-broadcast

The package [@gephi/gephi-lite-broadcast](https://www.npmjs.com/package/@gephi/gephi-lite-broadcast) is a browser TypeScript library to control a Gephi Lite instance using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API).

It exports a `Driver` class, that exposes various asynchronous methods to help feed Gephi Lite data, appearance settings, filters...

Here is a simple example to import a [Graphology](https://graphology.github.io/) graph in Gephi Lite in a new tab:

```typescript
import { GephiLiteDriver } from "@gephi/gephi-lite-broadcast";
import Graph from "graphology";

async function openGraphInGephiLite(graph: Graph) {
  const driver = new GephiLiteDriver();

  await driver.openGephiLite();

  await driver.importGraph(graph.toJSON());

  driver.destroy();
}
```

## TODO

### 1. Data update/reading:

- [x] `getGraph(): SerializedFullGraph` / `importGraph(graph: FullGraph)`
- [x] `setGraphDataset` / `getGraphDataset` / `mergeGraphDataset`
- [x] `setGraphAppearance` / `getGraphAppearance` / `mergeGraphAppearance`
- [x] `setFilters` / `getFilters`
- [ ] `setSelection` / `getSelection`

### 2. Other methods:

- [x] `ping` (to check broadcast status)
- [x] `getVersion`
- [ ] `zoomToNodes` / `resetZoom`
- [ ] `computeMetric`
- [ ] `computeLayout` / `startLayout` / `stopLayout`
- [ ] `notify`
- [ ] `exportGraph`
- [ ] methods to handle UI elements (right panel, left tabs, caption,
      fullscreen)

### 3. Events

- [x] `instanceCreation`
- [ ] `graphUpdate`
- [ ] `graphModelUpdate`
- [ ] `graphAppearanceUpdate`
- [ ] `filtersUpdate`
- [ ] `selectionUpdate`

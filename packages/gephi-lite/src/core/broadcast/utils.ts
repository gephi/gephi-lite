import { GephiLiteDriver } from "@gephi/gephi-lite-broadcast";
import { AppearanceState, FiltersState } from "@gephi/gephi-lite-sdk";

import { appearanceAtom } from "../appearance";
import { filtersAtom } from "../filters";
import { graphDatasetAtom } from "../graph";
import { GraphDataset } from "../graph/types";

export async function openInNewTab({
  dataset = graphDatasetAtom.get(),
  appearance = appearanceAtom.get(),
  filters = filtersAtom.get(),
}: { dataset?: GraphDataset; appearance?: AppearanceState; filters?: FiltersState } = {}) {
  const driver = new GephiLiteDriver();
  await driver.openGephiLite({ baseUrl: location.pathname });

  await Promise.all([driver.setAppearance(appearance), driver.setFilters(filters)]);
  await driver.setGraphDataset(dataset);

  driver.destroy();
}

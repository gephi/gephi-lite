import { GephiLiteDriver } from "@gephi/gephi-lite-broadcast";
import { AppearanceState } from "@gephi/gephi-lite-sdk";

import { appearanceAtom } from "../appearance";
import { graphDatasetAtom } from "../graph";
import { GraphDataset } from "../graph/types";

export async function openInNewTab({
  dataset = graphDatasetAtom.get(),
  appearance = appearanceAtom.get(),
}: { dataset?: GraphDataset; appearance?: AppearanceState } = {}) {
  const driver = new GephiLiteDriver();

  await new Promise<void>((resolve) => {
    // Wait for new instance to be fully working:
    driver.on("newInstance", () => {
      resolve();
    });
    driver.openGephiLite({
      baseUrl: location.pathname,
    });
  });

  // Feed graph:
  await driver.setGraphDataset(dataset);

  // Set graph appearance:
  await driver.setAppearance(appearance);

  driver.destroy();
}

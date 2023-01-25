import { FC, useEffect } from "react";
import { SigmaContainer, useSigma } from "@react-sigma/core";

import { useAppearance, useGraphDataset, useSigmaGraph } from "../../core/context/dataContexts";
import { getReducer } from "../../core/appearance/utils";

const SettingsController: FC = () => {
  const sigma = useSigma();
  const graphDataset = useGraphDataset();
  const graphAppearance = useAppearance();

  useEffect(() => {
    sigma.setSetting("nodeReducer", getReducer("nodes", sigma, graphDataset, graphAppearance));
    sigma.setSetting("edgeReducer", getReducer("edges", sigma, graphDataset, graphAppearance));
  }, [graphAppearance, graphDataset, sigma]);

  return null;
};

export const GraphRendering: FC = () => {
  const sigmaGraph = useSigmaGraph();

  return (
    <div className="stage">
      <SigmaContainer
        className="position-absolute inset-0"
        graph={sigmaGraph}
        initialSettings={{
          allowInvalidContainer: true,
        }}
      >
        <SettingsController />
      </SigmaContainer>
    </div>
  );
};

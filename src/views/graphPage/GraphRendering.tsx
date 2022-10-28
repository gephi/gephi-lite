import { FC } from "react";
import { SigmaContainer } from "@react-sigma/core";

import { useSigmaGraph } from "../../core/context/dataContexts";

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
      />
    </div>
  );
};

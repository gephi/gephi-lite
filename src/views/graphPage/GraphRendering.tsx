import { FC, useContext } from "react";
import { SigmaContainer } from "@react-sigma/core";

import { dataContext } from "../../core/context/dataContext";

export const GraphRendering: FC = () => {
  const sigmaGraph = useContext(dataContext).readSigmaGraph();

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

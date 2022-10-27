import { FC } from "react";
import { SigmaContainer } from "@react-sigma/core";

import { useReadAtom } from "../../core/utils/atoms";
import { sigmaGraphAtom } from "../../core/graph";

export const GraphRendering: FC = () => {
  const sigmaGraph = useReadAtom(sigmaGraphAtom);

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

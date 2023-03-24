import { useCallback, useEffect, useState } from "react";
import { pick } from "lodash";

import { useGraphDatasetActions, useSigmaGraph } from "../context/dataContexts";
import { WorkerSupervisorInterface } from "./types";
import { LAYOUTS } from "./collection";
import { resetCamera } from "../sigma";

export function useLayouts() {
  const sigmaGraph = useSigmaGraph();
  const { setNodePositions } = useGraphDatasetActions();
  const [supervisor, setSupervisor] = useState<WorkerSupervisorInterface | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  /**
   * When supervisor change
   *  => we stop/kill the worker if needed and save the position
   */
  useEffect(() => {
    return () => {
      if (supervisor) {
        supervisor.stop();
        supervisor.kill();

        // Save data
        setNodePositions(
          sigmaGraph.reduceNodes(
            (acc, nodeId, attrs) => ({
              ...acc,
              [nodeId]: pick(attrs, ["x", "y"]),
            }),
            {},
          ),
        );
      }
    };
  }, [supervisor, setNodePositions, sigmaGraph]);

  const stop = useCallback(() => {
    setSupervisor(null);
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (id: string, params: any) => {
      setIsRunning(true);
      setSupervisor(null);

      // search the layout
      const layout = LAYOUTS.find((l) => l.id === id);

      // Sync layout
      if (layout && layout.type === "sync") {
        // generate positions
        const positions = layout.run(sigmaGraph, { settings: params });

        // Save it
        setNodePositions(positions);

        setIsRunning(false);
        resetCamera();
      }

      // Sync layout
      if (layout && layout.type === "worker") {
        const worker = new layout.supervisor(sigmaGraph, { settings: params });
        worker.start();
        setSupervisor(worker);
      }
    },
    [sigmaGraph, setNodePositions],
  );

  return { isRunning, start, stop };
}

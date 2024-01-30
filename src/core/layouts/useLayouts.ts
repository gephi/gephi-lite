import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGraphDataset, useGraphDatasetActions, useSigmaGraph } from "../context/dataContexts";
import { dataGraphToFullGraph } from "../graph/utils";
import { useNotifications } from "../notifications";
import { resetCamera } from "../sigma";
import { LAYOUTS } from "./collection";
import { LayoutMapping, WorkerSupervisorInterface } from "./types";

export function useLayouts() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const dataset = useGraphDataset();
  const sigmaGraph = useSigmaGraph();
  const { setNodePositions } = useGraphDatasetActions();
  const [supervisor, setSupervisor] = useState<WorkerSupervisorInterface | null>(null);
  const [layoutId, setLayoutId] = useState<string | null>(null);
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
        const positions: LayoutMapping = {};
        sigmaGraph.forEachNode((node, { x, y }) => {
          positions[node] = { x, y };
        });
        setNodePositions(positions);
      }
    };
  }, [supervisor, setNodePositions, sigmaGraph, layoutId, notify, t]);

  const stop = useCallback(() => {
    setSupervisor(null);
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (id: string, params: unknown) => {
      setIsRunning(true);
      setSupervisor(null);
      setLayoutId(id);

      // search the layout
      const layout = LAYOUTS.find((l) => l.id === id);

      // Sync layout
      if (layout && layout.type === "sync") {
        const fullGraph = dataGraphToFullGraph(dataset);

        // generate positions
        const positions = layout.run(fullGraph, { settings: params });

        // Save it
        setNodePositions(positions);

        setIsRunning(false);

        // To prevent resetting the camera before sigma receives new data, we
        // need to wait a frame, and also wait for it to trigger a refresh:
        setTimeout(() => resetCamera({ forceRefresh: false }), 0);
      }

      // Sync layout
      if (layout && layout.type === "worker") {
        const worker = new layout.supervisor(sigmaGraph, { settings: params });
        worker.start();
        setSupervisor(worker);
      }
    },
    [dataset, setNodePositions, sigmaGraph],
  );

  return { isRunning, start, stop };
}

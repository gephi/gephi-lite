import { useCallback, useEffect, useState } from "react";
import { pick } from "lodash";
import { useTranslation } from "react-i18next";

import { useGraphDatasetActions, useSigmaGraph } from "../context/dataContexts";
import { useNotifications } from "../notifications";
import { WorkerSupervisorInterface } from "./types";
import { LAYOUTS } from "./collection";
import { resetCamera } from "../sigma";

export function useLayouts() {
  const { t } = useTranslation();
  const { notify } = useNotifications();
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
        notify({
          type: "info",
          message: t("layouts.exec.stopped", {
            layout: t(`layouts.${layoutId}.title`).toString(),
          }).toString(),
          title: t("layouts.title") as string,
        });

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
  }, [supervisor, setNodePositions, sigmaGraph, layoutId, notify, t]);

  const stop = useCallback(() => {
    setSupervisor(null);
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (id: string, params: any) => {
      setIsRunning(true);
      setSupervisor(null);
      setLayoutId(id);

      // search the layout
      const layout = LAYOUTS.find((l) => l.id === id);

      // Sync layout
      if (layout && layout.type === "sync") {
        // generate positions
        const positions = layout.run(sigmaGraph, { settings: params });

        // Save it
        setNodePositions(positions);

        setIsRunning(false);

        // To prevent resetting the camera before sigma receives new data, we
        // need to wait a frame, and also wait for it to trigger a refresh:
        setTimeout(() => resetCamera(false), 0);

        notify({
          type: "info",
          message: t("layouts.exec.started", {
            layout: t(`layouts.${id}.title`).toString(),
          }).toString(),
          title: t("layouts.title") as string,
        });
      }

      // Sync layout
      if (layout && layout.type === "worker") {
        const worker = new layout.supervisor(sigmaGraph, { settings: params });
        worker.start();
        setSupervisor(worker);
        notify({
          type: "success",
          message: t("layouts.exec.success", {
            layout: t(`layouts.${id}.title`).toString(),
          }).toString(),
          title: t("layouts.title") as string,
        });
      }
    },
    [sigmaGraph, setNodePositions, notify, t],
  );

  return { isRunning, start, stop };
}

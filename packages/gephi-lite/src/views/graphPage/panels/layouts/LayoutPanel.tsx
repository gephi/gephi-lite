import { type FC, useCallback, useEffect } from "react";

import { useLayoutActions, useLayoutState, useSessionActions } from "../../../../core/context/dataContexts";
import type { Layout } from "../../../../core/layouts/types";
import { useNotifications } from "../../../../core/notifications";
import { LayoutForm } from "./LayoutForm";
import { debounce } from "lodash";

export const LayoutPanel: FC<{ layout: Layout }> = ({ layout }) => {
  const { notify } = useNotifications();
  const { startLayout, stopLayout } = useLayoutActions();
  const { setLastLayout } = useSessionActions();
  const layoutState = useLayoutState();

  /**
   * When the selected layout change
   * => we set it as lastLayout in the session
   * => we stop the running the layout (if there is one)
   */
  useEffect(() => {
    setLastLayout(layout.id);
    if (layoutState.type === "running" && layoutState.layoutId !== layout.id) {
      stopLayout();
    }
  }, [layout.id, layoutState, stopLayout, setLastLayout]);

  //eslint-disable-next-line react-hooks/exhaustive-deps
  const onStart = useCallback(debounce(
    async (params: Record<string, unknown>, restart = false) => {
      try {
        await startLayout(layout.id, params, restart);
      } catch (e) {
        notify({ type: "error", message: (e as Error).message });
      }
    }, 300),
    [startLayout, layout.id, notify],
  );

  return (
    <LayoutForm
      layout={layout}
      onStart={onStart}
      onStop={stopLayout}
      isRunning={layoutState.type === "running" && layoutState.layoutId === layout.id}
    />
  );
};

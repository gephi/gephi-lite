import { debounce } from "lodash";
import { type FC, useCallback, useEffect, useMemo } from "react";

import { useLayoutActions, useLayoutState, useSessionActions } from "../../../../core/context/dataContexts";
import type { Layout } from "../../../../core/layouts/types";
import { useNotifications } from "../../../../core/notifications";
import { LayoutForm } from "./LayoutForm";

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
  const onStart = useCallback(
    debounce(
      async ({
        params,
        then,
        restart = false,
      }: {
        params: Record<string, unknown>;
        then?: () => void;
        restart?: boolean;
      }) => {
        try {
          await startLayout(layout.id, params, restart);
          then?.();
        } catch (e) {
          notify({ type: "error", message: (e as Error).message });
        }
      },
      300,
    ),
    [startLayout, layout.id, notify],
  );

  const status = useMemo(() => {
    if ("layoutId" in layoutState && layoutState.layoutId !== layout.id) return "idle";
    return layoutState.type;
  }, [layout.id, layoutState]);

  return <LayoutForm layout={layout} onStart={onStart} onStop={stopLayout} status={status} onCancel={stopLayout} />;
};

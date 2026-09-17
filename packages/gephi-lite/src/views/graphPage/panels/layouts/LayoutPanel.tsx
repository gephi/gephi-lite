import { debounce } from "lodash";
import { type FC, useCallback, useEffect, useMemo } from "react";

import { useLayoutActions, useLayoutState } from "../../../../core/context/dataContexts";
import type { Layout } from "../../../../core/layouts/types";
import { useNotifications } from "../../../../core/notifications";
import { LayoutForm } from "./LayoutForm";

export const LayoutPanel: FC<{ layout: Layout }> = ({ layout }) => {
  const { notify } = useNotifications();
  const { startLayout, stopLayout } = useLayoutActions();
  const layoutState = useLayoutState();

  /**
   * When the selected layout change
   * => we stop the running the layout (if there is one)
   */
  useEffect(() => {
    if (layoutState.runState.type === "running" && layoutState.runState.layoutId !== layout.id) {
      stopLayout();
    }
  }, [layout.id, layoutState, stopLayout]);

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
    if (layoutState.runState.type === "running" && layoutState.runState.layoutId === layout.id) return "running";
    return "idle";
  }, [layout.id, layoutState.runState]);

  return <LayoutForm layout={layout} onStart={onStart} onStop={stopLayout} status={status} onCancel={stopLayout} />;
};

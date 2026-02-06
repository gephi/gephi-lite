import { type FC } from "react";

import { useLayoutActions, useLayoutState } from "../../../../core/context/dataContexts";
import type { Layout } from "../../../../core/layouts/types";
import { useNotifications } from "../../../../core/notifications";
import { LayoutForm } from "./LayoutForm";

export const LayoutPanel: FC<{ layout: Layout }> = ({ layout }) => {
  const { notify } = useNotifications();
  const { startLayout, stopLayout } = useLayoutActions();
  const layoutState = useLayoutState();

  return (
    <LayoutForm
      layout={layout}
      onStart={async (params) => {
        try {
          await startLayout(layout.id, params);
        } catch (e) {
          notify({ type: "error", message: (e as Error).message });
        }
      }}
      onStop={() => {
        stopLayout();
      }}
      isRunning={layoutState.type === "running" && layoutState.layoutId === layout.id}
    />
  );
};

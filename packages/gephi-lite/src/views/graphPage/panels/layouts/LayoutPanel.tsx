import { type FC, useEffect } from "react";

import { useLayoutActions, useLayoutState } from "../../../../core/context/dataContexts";
import type { Layout } from "../../../../core/layouts/types";
import { useNotifications } from "../../../../core/notifications";
import { LayoutForm } from "./LayoutForm";

export const LayoutPanel: FC<{ layout: Layout }> = ({ layout }) => {
  const { notify } = useNotifications();
  const { startLayout, stopLayout } = useLayoutActions();
  const { type } = useLayoutState();

  useEffect(() => {
    return () => {
      stopLayout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      isRunning={type === "running"}
      onCancel={() => {
        stopLayout();
      }}
    />
  );
};

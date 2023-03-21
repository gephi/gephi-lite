import { FC, useEffect } from "react";
import { useRegisterEvents } from "@react-sigma/core";

import { useSelection, useSelectionActions } from "../../../core/context/dataContexts";

export const EventsController: FC = () => {
  const registerEvents = useRegisterEvents();

  const selection = useSelection();
  const { select, toggle, reset } = useSelectionActions();

  useEffect(() => {
    registerEvents({
      clickStage: () => {
        reset();
      },
      clickNode: ({ node, event }) => {
        if (event.original.ctrlKey) {
          toggle({
            type: "nodes",
            item: node,
          });
        }

        if (selection.type === "nodes" && selection.items.has(node) && selection.items.size === 1) {
          reset();
        } else {
          select({ type: "nodes", items: new Set([node]) });
        }
      },
    });
  }, [registerEvents, reset, select, selection, toggle]);

  return null;
};

import { FC, useEffect } from "react";
import { useSetSettings } from "@react-sigma/core";

import { memoizedDarken } from "../../../utils/colors";
import { useSelection } from "../../../core/context/dataContexts";
import { CustomEdgeDisplayData, CustomNodeDisplayData } from "../../../core/appearance/types";
import { DEFAULT_EDGE_COLOR, DEFAULT_EDGE_SIZE, DEFAULT_NODE_COLOR } from "../../../core/appearance/utils";

export const AppearanceController: FC = () => {
  const setSettings = useSetSettings();
  const selection = useSelection();

  // Reducers:
  useEffect(() => {
    const selectedNodes = selection.type === "nodes" ? selection.items : new Set<string>();
    const selectedEdges = selection.type === "edges" ? selection.items : new Set<string>();

    setSettings({
      nodeReducer: (id, attr) => {
        const res = { ...attr } as Partial<CustomNodeDisplayData>;

        if (selectedNodes.has(id)) {
          res.borderColor = memoizedDarken(res.color || DEFAULT_NODE_COLOR);
          res.boldLabel = true;
        }

        return res;
      },
      edgeReducer: (id, attr) => {
        const res = { ...attr } as Partial<CustomEdgeDisplayData>;

        if (selectedEdges.has(id)) {
          res.size = (res.size || DEFAULT_EDGE_SIZE) * 2;
          res.color = memoizedDarken(res.color || DEFAULT_EDGE_COLOR);
        }

        return attr;
      },
    });
  }, [selection, setSettings]);

  return null;
};

import { FC, useEffect } from "react";

import { useSelection } from "../../../core/context/dataContexts";
import { focusCameraOnEdges, focusCameraOnNodes } from "../../../core/sigma";

/**
 * Frames the camera on the current selection whenever it changes, so a newly selected node/edge
 * set is immediately visible, without waiting for a manual "locate on graph" click. Reuses the
 * same framing (and filtering to what's actually rendered) as that manual action.
 */
export const FocusOnSelectionController: FC = () => {
  const { type, items } = useSelection();

  useEffect(() => {
    if (!items.size) return;
    if (type === "nodes") focusCameraOnNodes(Array.from(items));
    else focusCameraOnEdges(Array.from(items));
  }, [type, items]);

  return null;
};

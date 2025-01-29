import { asyncAction, atom } from "@ouestware/atoms";
import { write } from "graphology-gexf";
import { toUndirected } from "graphology-operators";

import { applyVisualProperties } from "../../appearance/utils";
import { dynamicItemDataAtom, filteredGraphAtom, graphDatasetAtom, visualGettersAtom } from "../index";
import { dataGraphToFullGraph } from "../utils";
import { ExportState } from "./types";

function getEmptyExportState(): ExportState {
  return { type: "idle" };
}

/**
 * Public API:
 * ***********
 */
export const exportStateAtom = atom<ExportState>(getEmptyExportState());

/**
 * Actions:
 * ********
 */
export const exportAsGexf = asyncAction(async (callback: (content: string) => void | Promise<void>) => {
  // set loading
  exportStateAtom.set({ type: "loading" });

  try {
    // get the full graph
    const graphDataset = graphDatasetAtom.get();
    const filteredGraph = filteredGraphAtom.get();
    const dynamicNodeData = dynamicItemDataAtom.get();
    let graphToExport = dataGraphToFullGraph(graphDataset, filteredGraph);

    // apply current apperanc eon the graph
    const visualGetters = visualGettersAtom.get();
    applyVisualProperties(graphToExport, graphDataset, dynamicNodeData, visualGetters);

    // change the type of the graph based on the meta type (default is directed)
    if (graphDataset.metadata.type === "undirected") graphToExport = toUndirected(graphToExport);

    // generate the gexf
    const content = write(graphToExport, {});

    await callback(content);

    // idle state
    exportStateAtom.set({ type: "idle" });
  } catch (e) {
    console.error(e);
    exportStateAtom.set({ type: "error" });
  }
});

export const exportActions = {
  exportAsGexf,
};

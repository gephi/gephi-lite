import Graph from "graphology";
import { parse } from "graphology-gexf";

import { resetStates } from "../../context/dataContexts";
import { preferencesActions } from "../../preferences";
import { resetCamera } from "../../sigma";
import { atom } from "../../utils/atoms";
import { asyncAction } from "../../utils/producers";
import { graphDatasetActions } from "../index";
import { initializeGraphDataset } from "../utils";
import { ImportState, LocalFile, RemoteFile } from "./types";

function getEmptyImportState(): ImportState {
  return { type: "idle" };
}

/**
 * Public API:
 * ***********
 */
export const importStateAtom = atom<ImportState>(getEmptyImportState());

/**
 * Actions:
 * ********
 */
export const importRemoteGexf = asyncAction(async (remote: RemoteFile) => {
  const { setGraphDataset } = graphDatasetActions;
  const { addRemoteFile } = preferencesActions;

  if (importStateAtom.get().type === "loading") throw new Error("A file is already being loaded");

  importStateAtom.set({ type: "loading" });
  try {
    const response = await fetch(remote.url);
    const gexf = await response.text();
    const graph = parse(Graph, gexf, { allowUndeclaredAttributes: true, addMissingNodes: true });
    graph.setAttribute("title", remote.filename);
    resetStates();
    setGraphDataset({ ...initializeGraphDataset(graph), origin: remote });
    addRemoteFile(remote);
    resetCamera({ forceRefresh: true });
  } catch (e) {
    importStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    importStateAtom.set({ type: "idle" });
  }
});

export const importLocalGexf = asyncAction(async (file: LocalFile) => {
  const { setGraphDataset } = graphDatasetActions;

  if (importStateAtom.get().type === "loading") throw new Error("A file is already being loaded");

  importStateAtom.set({ type: "loading" });
  try {
    const content = await file.source.text();
    const graph = parse(Graph, content, { allowUndeclaredAttributes: true });
    graph.setAttribute("title", file.filename);
    resetStates();
    setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
    resetCamera({ forceRefresh: true });
  } catch (e) {
    importStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    importStateAtom.set({ type: "idle" });
  }
});

export const importActions = {
  importRemoteGexf,
  importLocalGexf,
};

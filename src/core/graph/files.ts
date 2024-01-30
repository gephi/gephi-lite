import Graph from "graphology";
import { parse } from "graphology-gexf";

import { resetStates } from "../context/dataContexts";
import { preferencesActions } from "../preferences";
import { resetCamera } from "../sigma";
import { atom } from "../utils/atoms";
import { asyncAction } from "../utils/producers";
import { graphDatasetActions } from "./index";
import { FileState, LocalFile, RemoteFile } from "./types";
import { getEmptyFileState, initializeGraphDataset } from "./utils";

/**
 * Public API:
 * ***********
 */
export const fileStateAtom = atom<FileState>(getEmptyFileState());

/**
 * Actions:
 * ********
 */
export const openRemoteFile = asyncAction(async (remote: RemoteFile) => {
  const { setGraphDataset } = graphDatasetActions;
  const { addRemoteFile } = preferencesActions;

  if (fileStateAtom.get().type === "loading") throw new Error("A file is already being loaded");

  fileStateAtom.set({ type: "loading" });
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
    fileStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    fileStateAtom.set({ type: "idle" });
  }
});

export const openLocalFile = asyncAction(async (file: LocalFile) => {
  const { setGraphDataset } = graphDatasetActions;

  if (fileStateAtom.get().type === "loading") throw new Error("A file is already being loaded");

  fileStateAtom.set({ type: "loading" });
  try {
    const content = await file.source.text();
    const graph = parse(Graph, content, { allowUndeclaredAttributes: true });
    graph.setAttribute("title", file.filename);
    resetStates();
    setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
    resetCamera({ forceRefresh: true });
  } catch (e) {
    fileStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    fileStateAtom.set({ type: "idle" });
  }
});

export const fileActions = {
  openRemoteFile,
  openLocalFile,
};

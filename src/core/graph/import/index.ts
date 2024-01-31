import Graph from "graphology";
import gexf from "graphology-gexf";
import graphml from "graphology-graphml/browser";

import { resetStates } from "../../context/dataContexts";
import { preferencesActions } from "../../preferences";
import { resetCamera } from "../../sigma";
import { atom } from "../../utils/atoms";
import { asyncAction } from "../../utils/producers";
import { graphDatasetActions } from "../index";
import { initializeGraphDataset } from "../utils";
import { GraphOrigin, ImportState, LocalFile, RemoteFile } from "./types";

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

/**
 * Generic function that import a graphology instance in gephi-lite
 */
async function importFromGraphology<T extends NonNullable<GraphOrigin>>(
  file: T,
  getGraphology: (file: T) => Promise<Graph>,
) {
  if (importStateAtom.get().type === "loading") throw new Error("A file is already being loaded");
  importStateAtom.set({ type: "loading" });
  try {
    const graph = await getGraphology(file);
    const { setGraphDataset } = graphDatasetActions;
    const { addRemoteFile } = preferencesActions;
    graph.setAttribute("title", file.filename);
    resetStates();
    setGraphDataset({ ...initializeGraphDataset(graph), origin: file });
    if (file.type === "remote") addRemoteFile(file);
    resetCamera({ forceRefresh: true });
  } catch (e) {
    importStateAtom.set({ type: "error", message: (e as Error).message });
    throw e;
  } finally {
    importStateAtom.set({ type: "idle" });
  }
}

export const importLocalGexf = asyncAction(async (file: LocalFile) => {
  return importFromGraphology(file, async (file) => {
    const content = await file.source.text();
    const graph = gexf.parse(Graph, content, { allowUndeclaredAttributes: true, addMissingNodes: true });
    return graph;
  });
});
export const importRemoteGexf = asyncAction(async (file: RemoteFile) => {
  return importFromGraphology(file, async (file) => {
    const response = await fetch(file.url);
    const content = await response.text();
    const graph = gexf.parse(Graph, content, { allowUndeclaredAttributes: true, addMissingNodes: true });
    return graph;
  });
});

export const importLocalGraphml = asyncAction(async (file: LocalFile) => {
  return importFromGraphology(file, async (file) => {
    const content = await file.source.text();
    const graph = graphml.parse(Graph, content, { addMissingNodes: true });
    return graph;
  });
});
export const importRemoteGraphml = asyncAction(async (file: RemoteFile) => {
  return importFromGraphology(file, async (file) => {
    const response = await fetch(file.url);
    const content = await response.text();
    const graph = graphml.parse(Graph, content, { addMissingNodes: true });
    return graph;
  });
});

export const importFile = asyncAction(async (file: RemoteFile | LocalFile) => {
  const extension = (file.filename.split(".").pop() || "").toLowerCase();
  switch (extension) {
    case "gexf":
      if (file.type === "remote") await importRemoteGexf(file);
      else await importLocalGexf(file);
      break;
    case "graphml":
      if (file.type === "remote") await importRemoteGraphml(file);
      else await importLocalGraphml(file);
      break;
    default:
      throw new Error(`Extension ${extension} for file ${file.filename} is not recognized`);
  }
});

export const importActions = {
  importFile,
  importRemoteGexf,
  importLocalGexf,
  importRemoteGraphml,
  importLocalGraphml,
};

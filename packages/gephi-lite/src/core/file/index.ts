import { Producer, asyncAction, atom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { write } from "graphology-gexf";
import { isEqual } from "lodash";

import { config } from "../../config";
import { appearanceAtom } from "../appearance";
import { resetStates } from "../context/dataContexts";
import { filtersAtom } from "../filters";
import { graphDatasetActions, graphDatasetAtom } from "../graph";
import { initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";
import { FileState, FileType, GephiLiteFileFormat, JSONValue } from "./types";
import { geFullDataGraph, importGephiLiteFormat, jsonSerializer, parseFile } from "./utils";

function getEmptyFileState(): FileState {
  return { current: null, recentFiles: [], status: { type: "idle" } };
}

/**
 * Public API:
 * ***********
 */
export const fileAtom = atom<FileState>(getEmptyFileState());

/**
 * Produces :
 * ***********
 */
const addRecentFile: Producer<FileState, [FileType]> = (file) => {
  return (prev) => ({
    ...prev,
    recentFiles: [file, ...prev.recentFiles.filter((f) => !isEqual(f, file))].slice(0, 5),
  });
};

const setCurrentFile: Producer<FileState, [FileType | null]> = (file) => {
  return (prev) => ({
    ...prev,
    current: file,
  });
};

export const reset: Producer<FileState, []> = () => {
  return () => getEmptyFileState();
};

/**
 * Actions:
 * ********
 */
export const open = asyncAction(async (file: FileType) => {
  if (fileAtom.get().status.type === "loading") throw new Error("A file is already being loaded");
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));

  try {
    // Parse the file
    const data = await parseFile(file);

    // Do the import
    resetStates(false);
    if (data instanceof Graph) {
      const { setGraphDataset } = graphDatasetActions;
      data.setAttribute("title", file.filename);
      setGraphDataset(initializeGraphDataset(data));
    } else {
      importGephiLiteFormat(data);
    }

    // Add the new file in the history list
    // (only for remote or cloud)
    addRecentFile(file);

    // Reset the camera
    resetCamera({ forceRefresh: true });
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
    throw e;
  } finally {
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  }
});

export const save = asyncAction(async (callback: (data: JSONValue) => void | Promise<void>) => {
  // set loading
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));
  try {
    const data: GephiLiteFileFormat = {
      type: "gephi-lite",
      version: config.version,
      graphDataset: graphDatasetAtom.get(),
      filters: filtersAtom.get(),
      appearance: appearanceAtom.get(),
    };
    await callback(jsonSerializer(data));
    // idle state
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
  }
});

export const exportAsGexf = asyncAction(async (callback: (content: string) => void | Promise<void>) => {
  // set loading
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));
  try {
    const graphToExport = geFullDataGraph();
    // generate the gexf
    const content = write(graphToExport, {});
    // Calling the callback
    await callback(content);
    // idle state
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
  }
});

export const exportAsGraphology = asyncAction(async (callback: (content: string) => void | Promise<void>) => {
  // set loading
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));
  try {
    const graphToExport = geFullDataGraph();
    // generate the gexf
    const content = JSON.stringify(graphToExport.export(), null, 2);
    // Calling the callback
    await callback(content);
    // idle state
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
  }
});

export const fileActions = {
  open,
  save,
  exportAsGexf,
  exportAsGraphology,
  addRecentFile: producerToAction(addRecentFile, fileAtom),
  reset: producerToAction(reset, fileAtom),
  setCurrentFile: producerToAction(setCurrentFile, fileAtom),
};

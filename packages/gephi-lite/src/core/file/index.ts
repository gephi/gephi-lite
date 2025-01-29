import { gephiLiteStringify } from "@gephi/gephi-lite-sdk";
import { Producer, asyncAction, atom, producerToAction } from "@ouestware/atoms";
import { write } from "graphology-gexf";
import { isEqual } from "lodash";

import { config } from "../../config";
import { appearanceAtom } from "../appearance";
import { resetStates } from "../context/dataContexts";
import { filtersAtom } from "../filters";
import { graphDatasetActions, graphDatasetAtom } from "../graph";
import { initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";
import { FileState, FileType, FileTypeWithoutFormat, GephiLiteFileFormat } from "./types";
import { geFullDataGraph, importGephiLiteFormat, parseFile } from "./utils";

function getEmptyFileState(): FileState {
  return { current: null, recentFiles: [], status: { type: "idle" } };
}

function getLocalStorageFileState(): FileState {
  const raw = localStorage.getItem("file");
  const state = raw ? JSON.parse(raw) : null;
  return {
    ...getEmptyFileState(),
    ...state,
  };
}

/**
 * Public API:
 * ***********
 */
export const fileAtom = atom<FileState>(getLocalStorageFileState());

/**
 * Produces :
 * ***********
 */
const setCurrentFile: Producer<FileState, [FileType | null]> = (file) => {
  return (prev) => {
    return {
      ...prev,
      current: file,
      recentFiles:
        file === null ? prev.recentFiles : [file, ...prev.recentFiles.filter((f) => !isEqual(f, file))].slice(0, 5),
    };
  };
};

export const reset: Producer<FileState, [boolean]> = (full) => {
  return (prev) => {
    if (full) return getEmptyFileState();
    return { ...prev, current: null };
  };
};

/**
 * Actions:
 * ********
 */
export const open = asyncAction(async (file: FileTypeWithoutFormat) => {
  if (fileAtom.get().status.type === "loading") throw new Error("A file is already being loaded");
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));

  try {
    // Parse the file
    const { data, format } = await parseFile(file);

    // Do the import
    resetStates(false);
    if (format === "gephi-lite") {
      importGephiLiteFormat(data);
    } else {
      const { setGraphDataset } = graphDatasetActions;
      data.setAttribute("title", file.filename);
      setGraphDataset(initializeGraphDataset(data));
    }

    // Add the new file in the history list
    fileActions.setCurrentFile({ ...file, format });

    // Reset the camera
    resetCamera({ forceRefresh: true });
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
    throw e;
  } finally {
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  }
});

export const exportAsGephiLite = asyncAction(async (callback: (data: string) => void | Promise<void>) => {
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
    const content = gephiLiteStringify(data);
    await callback(content);
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

export const fileActions = {
  open,
  exportAsGephiLite,
  exportAsGexf,
  reset: producerToAction(reset, fileAtom),
  setCurrentFile: producerToAction(setCurrentFile, fileAtom),
};

/**
 * Bindings:
 * *********
 */
fileAtom.bind((file) => {
  localStorage.setItem("file", gephiLiteStringify(file));
});

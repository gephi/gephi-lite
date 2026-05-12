import { gephiLiteStringify } from "@gephi/gephi-lite-sdk";
import { Producer, asyncAction, atom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { write } from "graphology-gexf";
import { isEmpty, isEqual } from "lodash";

import { config } from "../../config";
import { appearanceActions, appearanceAtom } from "../appearance";
import { applyVisualProperties, inferAppearanceState } from "../appearance/utils";
import { resetStates } from "../context/dataContexts";
import { filtersActions, filtersAtom } from "../filters";
import {
  dynamicItemDataAtom,
  filteredGraphAtom,
  graphDatasetActions,
  graphDatasetAtom,
  visualGettersAtom,
} from "../graph";
import { dataGraphToFullGraph, initializeGraphDataset } from "../graph/utils";
import { resetCamera } from "../sigma";
import { CloudFile, FileState, FileType, FileTypeWithoutFormat, GephiLiteFileFormat } from "./types";
import { extractGraphFromFile, openAndParseFile } from "./utils";

const DATAVIZ_PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getEmptyFileState(): FileState {
  return { current: null, recentFiles: [], status: { type: "idle" } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDateValue(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }
  return new Date();
}

function isFileFormat(value: unknown): value is CloudFile["format"] {
  return value === "gexf" || value === "gephi-lite" || value === "graphology" || value === "graphml" || value === "csv";
}

function sanitizeCloudFile(file: unknown): CloudFile | null {
  if (!isRecord(file)) return null;
  if (file.type !== "cloud" || typeof file.id !== "string" || !DATAVIZ_PROJECT_ID_PATTERN.test(file.id)) return null;
  if (typeof file.filename !== "string") return null;

  return {
    type: "cloud",
    id: file.id,
    filename: file.filename,
    description: typeof file.description === "string" ? file.description : "",
    createdAt: parseDateValue(file.createdAt),
    updatedAt: parseDateValue(file.updatedAt),
    isPublic: Boolean(file.isPublic),
    size: typeof file.size === "number" ? file.size : 0,
    format: isFileFormat(file.format) ? file.format : "gephi-lite",
    webUrl: typeof file.webUrl === "string" ? file.webUrl : undefined,
    thumbnailUrl: typeof file.thumbnailUrl === "string" ? file.thumbnailUrl : undefined,
  };
}

function sanitizeStoredFile(file: unknown): FileType | null {
  if (!isRecord(file) || typeof file.type !== "string") return null;
  if (file.type === "cloud") return sanitizeCloudFile(file);
  return file as unknown as FileType;
}

function getLocalStorageFileState(): FileState {
  const raw = localStorage.getItem("file");
  const state = raw ? JSON.parse(raw) : null;
  const current = sanitizeStoredFile(state?.current);
  const recentFiles = Array.isArray(state?.recentFiles)
    ? state.recentFiles
        .map((file: unknown) => sanitizeStoredFile(file))
        .filter((file: FileType | null): file is FileType => file !== null)
    : [];

  return {
    ...getEmptyFileState(),
    ...state,
    current,
    recentFiles,
    status: { type: "idle" },
  };
}

function geFullDataGraph(): Graph {
  // get the full graph
  const graphDataset = graphDatasetAtom.get();
  const filteredGraph = filteredGraphAtom.get();
  const dynamicNodeData = dynamicItemDataAtom.get();
  const fullDataGraph = dataGraphToFullGraph(graphDataset, filteredGraph);

  // apply current appearance on the graph
  const visualGetters = visualGettersAtom.get();
  applyVisualProperties(fullDataGraph, graphDataset, dynamicNodeData, visualGetters);

  return fullDataGraph;
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
    const { data, metadata, format } = await openAndParseFile(file);

    // Do the import
    resetStates(false);
    if (format === "gephi-lite") {
      const { graphDataset, appearance, filters } = data;
      // Load the graph
      const { setGraphDataset } = graphDatasetActions;
      setGraphDataset(graphDataset);
      // Load appearance
      const { setFullState } = appearanceActions;
      setFullState(appearance);
      // Load filters
      const { setFilters } = filtersActions;
      setFilters(filters);
    } else {
      const { setGraphDataset } = graphDatasetActions;
      const { mergeState } = appearanceActions;
      data.setAttribute("title", file.filename);

      const graphDataset = initializeGraphDataset(data, metadata);
      setGraphDataset(graphDataset);

      const appearanceState = inferAppearanceState(graphDataset);
      if (!isEmpty(appearanceState)) mergeState(appearanceState);
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

/**
 * Open a project from JSON data (typically from dataviz-tool-header API).
 * Used by onProjectLoad callback from the new header API.
 */
export const openFromData = asyncAction(async (projectData: object, name: string, projectId: string) => {
  if (fileAtom.get().status.type === "loading") throw new Error("A file is already being loaded");
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));

  try {
    const displayName = name || "Gephi Lite Project";
    const content = JSON.stringify(projectData);
    const filename = displayName.endsWith(".json") ? displayName : `${displayName}.json`;
    const { data, format } = await extractGraphFromFile(content, filename);

    resetStates(false);
    if (format === "gephi-lite") {
      const { graphDataset, appearance, filters } = data as GephiLiteFileFormat;
      const { setGraphDataset } = graphDatasetActions;
      setGraphDataset(graphDataset);
      const { setFullState } = appearanceActions;
      setFullState(appearance);
      const { setFilters } = filtersActions;
      setFilters(filters);
    } else {
      const { setGraphDataset } = graphDatasetActions;
      const { mergeState } = appearanceActions;
      (data as Graph).setAttribute("title", displayName);
      const graphDataset = initializeGraphDataset(data as Graph, undefined);
      setGraphDataset(graphDataset);
      const appearanceState = inferAppearanceState(graphDataset);
      if (!isEmpty(appearanceState)) mergeState(appearanceState);
    }

    fileActions.setCurrentFile({
      type: "cloud",
      id: projectId,
      filename: displayName,
      description: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      size: 0,
      format,
    } as CloudFile);

    resetCamera({ forceRefresh: true });
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
    throw e;
  } finally {
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" } }));
  }
});

export const fileActions = {
  open,
  openFromData,
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

import { FieldModel, ItemData, ItemType, Scalar, gephiLiteStringify } from "@gephi/gephi-lite-sdk";
import { Producer, asyncAction, atom, producerToAction } from "@ouestware/atoms";
import Graph from "graphology";
import { write } from "graphology-gexf";
import { isEmpty, isEqual } from "lodash";

import { config } from "../../config";
import { localStorage } from "../../utils/storage";
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
import { sessionActions, sessionAtom } from "../session";
import { resetCamera } from "../sigma";
import { userAtom } from "../user";
import { FileState, FileType, FileTypeWithoutFormat, GephiLiteFileFormat } from "./types";
import { openAndParseFile } from "./utils";

function getEmptyFileState(): FileState {
  return { current: null, recentFiles: [], status: { type: "idle" }, isDirty: false };
}

function getLocalStorageFileState(): FileState {
  const raw = localStorage.getItem("file");
  const state = raw ? JSON.parse(raw) : null;
  return {
    ...getEmptyFileState(),
    ...state,
    status: { type: "idle" },
    isDirty: false,
  };
}

function geFullDataGraph(): Graph {
  // get the full graph
  const graphDataset = graphDatasetAtom.get();
  const filteredGraph = filteredGraphAtom.get();
  const dynamicItemData = dynamicItemDataAtom.get();
  const fullDataGraph = dataGraphToFullGraph(graphDataset, filteredGraph);

  // apply current appearance on the graph
  const visualGetters = visualGettersAtom.get();
  applyVisualProperties(fullDataGraph, graphDataset, dynamicItemData, visualGetters);

  // Materialize the computed values of "formula" (scripted) fields as static attributes on the
  // exported graph. This makes them part of exports (eg. GEXF), while only mutating this freshly
  // built export graph — the dataset (and thus the formula definitions and the native gephi-lite
  // save) are left untouched.
  const materializeScriptFields = (itemType: ItemType, fields: FieldModel[], dynamicData: Record<string, ItemData>) => {
    const scriptFields = fields.filter((f) => f.script);
    if (!scriptFields.length) return;
    const itemIds = itemType === "nodes" ? fullDataGraph.nodes() : fullDataGraph.edges();
    const setAttribute = (id: string, key: string, value: Scalar) =>
      itemType === "nodes"
        ? fullDataGraph.setNodeAttribute(id, key, value)
        : fullDataGraph.setEdgeAttribute(id, key, value);
    itemIds.forEach((id) => {
      scriptFields.forEach((field) => {
        const value = dynamicData[id]?.[field.id];
        if (value !== undefined && value !== null) setAttribute(id, field.id, value);
      });
    });
  };
  materializeScriptFields("nodes", graphDataset.nodeFields, dynamicItemData.dynamicNodeData);
  materializeScriptFields("edges", graphDataset.edgeFields, dynamicItemData.dynamicEdgeData);

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

// Clears isDirty without touching the current file pointer: used after the graph dataset,
// appearance or filters atoms get bulk-replaced by something other than an actual user edit (e.g.
// the sessionStorage rehydration on page reload), which would otherwise flip isDirty back to true
// through the markDirty bindings below, even though nothing was actually modified.
export const clearDirty: Producer<FileState, []> = () => (prev) => (prev.isDirty ? { ...prev, isDirty: false } : prev);

export const reset: Producer<FileState, [boolean]> = (full) => {
  return (prev) => {
    if (full) return getEmptyFileState();
    // A blank workspace has nothing unsaved yet: isDirty must be cleared here, since it runs
    // after the graph/appearance/filters atoms were just reset to their own blank state, which
    // (being a new value reference) already flipped it back to true via the markDirty bindings.
    return { ...prev, current: null, isDirty: false };
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
      const { graphDataset, appearance, filters, session } = data;
      // Load the graph
      const { setGraphDataset } = graphDatasetActions;
      setGraphDataset(graphDataset);
      // Load appearance
      const { setFullState } = appearanceActions;
      setFullState(appearance);
      // Load filters
      const { setFilters } = filtersActions;
      setFilters(filters);
      // Load the session (layouts & metrics parameters), when the file carries one. Older files
      // predate this field: their session is left as-is (the current tab's one).
      if (session) sessionActions.setFullState(session);
    } else {
      const { setGraphDataset } = graphDatasetActions;
      const { mergeState } = appearanceActions;
      data.setAttribute("title", file.filename);

      const graphDataset = initializeGraphDataset(data, metadata);
      setGraphDataset(graphDataset);

      const appearanceState = inferAppearanceState(graphDataset);
      if (!isEmpty(appearanceState)) mergeState(appearanceState);
    }

    // Add the new file in the history list.
    // For a cloud (GitHub) file, memorize the metadata (esp. updatedAt) read from the SAME "detail"
    // endpoint the freshness guard uses (getFile → GET /gists/{id}), not the one that brought us here
    // (the "list" endpoint GET /gists, used by getFiles, or a stale localStorage entry). The two can
    // report a slightly different updated_at for the very same gist version; memorizing the list one
    // then comparing against the detail one would make the guard warn "remote is newer" on every tick
    // without any real change. Falls back to the passed file if the detail read is unavailable.
    let fileToMemorize: FileTypeWithoutFormat = file;
    if (file.type === "cloud") {
      const user = userAtom.get();
      const fresh = user ? await user.provider.getFile(file.id) : null;
      if (fresh) fileToMemorize = { ...file, ...fresh };
    }
    fileActions.setCurrentFile({ ...fileToMemorize, format });

    // Reset the camera
    resetCamera({ forceRefresh: true });
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" }, isDirty: false }));
  } catch (e) {
    fileAtom.set((prev) => ({ ...prev, status: { type: "error", message: (e as Error).message } }));
    throw e;
  }
});

export const exportAsGephiLite = asyncAction(async (callback: (data: string) => void | Promise<void>) => {
  // set loading
  fileAtom.set((prev) => ({ ...prev, status: { type: "loading" } }));
  try {
    const data: GephiLiteFileFormat = {
      type: "gephi-lite",
      version: config.version.toString(),
      graphDataset: graphDatasetAtom.get(),
      filters: filtersAtom.get(),
      appearance: appearanceAtom.get(),
      session: sessionAtom.get(),
    };
    const content = gephiLiteStringify(data);
    await callback(content);
    // idle state, and the current file now matches what was just exported
    fileAtom.set((prev) => ({ ...prev, status: { type: "idle" }, isDirty: false }));
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
  clearDirty: producerToAction(clearDirty, fileAtom),
};

/**
 * Bindings:
 * *********
 */

// Mark the current file as dirty as soon as the graph dataset, appearance or filters change:
const markDirty = () => fileAtom.set((prev) => (prev.isDirty ? prev : { ...prev, isDirty: true }));
graphDatasetAtom.bind(markDirty);
appearanceAtom.bind(markDirty);
filtersAtom.bind(markDirty);

fileAtom.bind((file) => {
  localStorage.setItem("file", gephiLiteStringify(file));
});

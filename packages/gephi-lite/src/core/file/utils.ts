import { gephiLiteParse } from "@gephi/gephi-lite-sdk";
import Graph from "graphology";
import gexf from "graphology-gexf/browser";
import graphml from "graphology-graphml/browser";
import { toUndirected } from "graphology-operators";

import { appearanceActions } from "../appearance";
import { applyVisualProperties } from "../appearance/utils";
import { filtersActions } from "../filters";
import {
  dynamicItemDataAtom,
  filteredGraphAtom,
  graphDatasetActions,
  graphDatasetAtom,
  visualGettersAtom,
} from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { userAtom } from "../user";
import { FileFormat, FileTypeWithoutFormat, GephiLiteFileFormat, fileFormatExt } from "./types";

/**
 * Returns the content of the given file.
 * If no content has been found, an exception raised.
 */
async function getFileContent(file: FileTypeWithoutFormat): Promise<string> {
  // Get file content
  let content: string | null = null;
  switch (file.type) {
    case "local":
      content = await file.source.text();
      break;
    case "remote": {
      const response = await fetch(file.url);
      content = await response.text();
      break;
    }
    case "cloud": {
      const user = userAtom.get();
      if (!user) throw new Error("Cannot open a cloud file without to be connected");
      content = await user.provider.getFileContent(file.id);
      break;
    }
    default:
      content = null;
      break;
  }
  if (content === null) throw new Error(`Type ${file.type} for file ${file.filename} is not recognized`);
  return content;
}

/**
 * Parse the content of the given file and returns its data and its type.
 */
export async function parseFile(
  file: FileTypeWithoutFormat,
): Promise<
  { format: "gexf" | "graphml" | "graphology"; data: Graph } | { format: "gephi-lite"; data: GephiLiteFileFormat }
> {
  const content = await getFileContent(file);
  const extension = (file.filename.split(".").pop() || "").toLowerCase();

  // Based on file extension, parse it to build a graphology
  switch (extension) {
    case "gexf":
      return {
        format: "gexf",
        data: gexf.parse(Graph, content, { allowUndeclaredAttributes: true, addMissingNodes: true }),
      };
    case "graphml":
      return {
        format: "graphml",
        data: graphml.parse(Graph, content, { addMissingNodes: true }),
      };
    case "json": {
      const jsonContent = gephiLiteParse(content);
      if ("type" in jsonContent && jsonContent.type === "gephi-lite") {
        return {
          format: "gephi-lite",
          data: jsonContent,
        };
      } else {
        return {
          format: "graphology",
          data: Graph.from(jsonContent),
        };
      }
    }
  }
  throw new Error(`Extension ${extension} for file ${file.filename} is not recognized`);
}

/**
 * Return the full graph of gephi-lite with all the data attributes.
 */
export function geFullDataGraph(): Graph {
  // get the full graph
  const graphDataset = graphDatasetAtom.get();
  const filteredGraph = filteredGraphAtom.get();
  const dynamicNodeData = dynamicItemDataAtom.get();
  let fullDataGraph = dataGraphToFullGraph(graphDataset, filteredGraph);

  // apply current appearance on the graph
  const visualGetters = visualGettersAtom.get();
  applyVisualProperties(fullDataGraph, graphDataset, dynamicNodeData, visualGetters);

  // change the type of the graph based on the meta type (default is directed)
  if (graphDataset.metadata.type === "undirected") fullDataGraph = toUndirected(fullDataGraph);

  return fullDataGraph;
}

/**
 * Import a gephi-lite format
 */
export function importGephiLiteFormat(data: GephiLiteFileFormat) {
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
}

/**
 * Given a filename and a format, returns the filename with the good extension.
 * Ex : 'miserable.gexf' with "graphology" will give you `miserable.json`
 */
export function getFilename(filename: string, format: FileFormat): string {
  const result = filename.match(/(.*)\.(.{1,4})$/);
  const baseFilename = result && result.length === 3 ? result[1] : filename;
  return `${baseFilename}.${fileFormatExt[format]}`;
}

import Graph from "graphology";
import gexf from "graphology-gexf/browser";
import graphml from "graphology-graphml/browser";
import { toUndirected } from "graphology-operators";
import { SerializedGraph } from "graphology-types";
import { isArray, isNil, isObject, isPlainObject } from "lodash";

import { appearanceActions } from "../appearance";
import { applyVisualProperties } from "../appearance/utils";
import { filtersActions } from "../filters";
import { filteredGraphAtom, graphDatasetActions, graphDatasetAtom, visualGettersAtom } from "../graph";
import { dataGraphToFullGraph } from "../graph/utils";
import { userAtom } from "../user";
import { FileType, GephiLiteFileFormat, JSONValue } from "./types";

/**
 * Returns the content of the given file.
 * If no content has been found, an exception raised.
 */
async function getFileContent(file: FileType): Promise<string> {
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
 * Parse the content of the given file.
 * If it's a gephi-lite format, it returns the `GephiLiteFormat`, otherwise a `Graph` instance.
 */
export async function parseFile(file: FileType): Promise<Graph | GephiLiteFileFormat> {
  const content = await getFileContent(file);
  const extension = (file.filename.split(".").pop() || "").toLowerCase();

  // Based on file extension, parse it to build a graphology
  let data: Graph | GephiLiteFileFormat | null = null;
  switch (extension) {
    case "gexf":
      data = gexf.parse(Graph, content, { allowUndeclaredAttributes: true, addMissingNodes: true });
      break;
    case "graphml":
      data = graphml.parse(Graph, content, { addMissingNodes: true });
      break;
    case "json": {
      const jsonContent = JSON.parse(content);
      if ("type" in jsonContent && jsonContent.type === "gephi-lite") data = jsonDeserializer(jsonContent);
      else data = Graph.from(jsonContent);
      break;
    }
  }
  if (data === null) throw new Error(`Extension ${extension} for file ${file.filename} is not recognized`);
  return data;
}

/**
 * Return the full graph of gephi-lite with all the data attributes.
 */
export function geFullDataGraph(): Graph {
  // get the full graph
  const graphDataset = graphDatasetAtom.get();
  const filteredGraph = filteredGraphAtom.get();
  let fullDataGraph = dataGraphToFullGraph(graphDataset, filteredGraph);

  // apply current apperanc eon the graph
  const visualGetters = visualGettersAtom.get();
  applyVisualProperties(fullDataGraph, graphDataset, visualGetters);

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
  // Load  appearance
  const { setFullState } = appearanceActions;
  setFullState(appearance);
  // Load filters
  const { setFilters } = filtersActions;
  setFilters(filters);
}

/**
 * Serialize an object in JSON.
 * This is needed for complexe types (like Set, Graph, ...).
 */
export function jsonSerializer(value: unknown): JSONValue {
  if (isNil(value)) return null;
  switch (typeof value) {
    case "undefined":
      return null;
    case "boolean":
    case "string":
    case "number":
      return value;
    case "function":
      return { type: "function", value: value.toString() };
    default:
      // Handle date
      if (value instanceof Date) {
        return { type: "Date", value: value.getTime() };
      }
      // Handle graph instance
      else if (value instanceof Graph) {
        return { type: "Graph", value: value.export() };
      }
      // Handle Set
      else if (value instanceof Set) {
        return { type: "Set", value: Array.from(value).map((n) => jsonSerializer(n)) };
      }
      // Handle array
      else if (isArray(value)) {
        return value.map((n) => jsonSerializer(n));
      }
      // Handle object
      else if (isPlainObject(value)) {
        return Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => [k, jsonSerializer(v)])
          .reduce((acc, [k, v]) => ({ ...acc, [`${k}`]: v }), {});
      }
      console.log(value, isPlainObject(value));
      throw new Error(`Don't know how to serialize in JSON value ${JSON.stringify(value)}`);
  }
}

/**
 * Deserialize a JSON
 */
export function jsonDeserializer<T = unknown>(value: JSONValue): T {
  if (isArray(value)) {
    return value.map((n) => jsonDeserializer(n)) as unknown as T;
  }
  if (isObject(value)) {
    if ("type" in value) {
      console.log(value.type);
      switch (value.type) {
        case "Graph":
          return Graph.from(value.value as unknown as SerializedGraph) as unknown as T;
        case "Date":
          if (!("value" in value) || isNil(value.value)) throw new Error(`Bad attribut "value" for date type`);
          return new Date(value.value as unknown as number) as unknown as T;
        case "Set":
          if (!("value" in value) || !isArray(value.value)) throw new Error(`Bad attribut "value" for Set type`);
          return new Set(value.value as unknown as Array<unknown>) as unknown as T;
        case "function":
          if (!("value" in value)) throw new Error(`Bad attribut "value" for Function type`);
          console.log(value.value);
          return new Function(`return ${value.value}`)();
      }
    }

    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, jsonDeserializer(v as unknown as JSONValue)])
      .reduce((acc, [k, v]) => ({ ...acc, [`${k}`]: v }), {}) as unknown as T;
  }

  return value as unknown as T;
}

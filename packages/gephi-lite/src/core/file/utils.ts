import { FieldModel, gephiLiteParse } from "@gephi/gephi-lite-sdk";
import type { ReturnTypeOf } from "@octokit/core/types";
import Graph from "graphology";
import gexf from "graphology-gexf/browser";
import graphml from "graphology-graphml/browser";
import { has, isArray, isFunction, isObject } from "lodash";
import { parse as parseVersion } from "semver";

import { config } from "../../config";
import { GephiLiteError } from "../errors";
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
 * Takes a graph file content and filename, and returns a Graphology instance (with some additional metadata).
 */
export async function extractGraphFromFile(
  fileContent: string,
  fileName: string,
  opts: { force?: boolean } = {},
): Promise<
  | {
      format: "gexf" | "graphml" | "graphology";
      data: Graph;
      metadata?: { nodeFields?: FieldModel<"nodes">[]; edgeFields?: FieldModel<"edges">[] };
    }
  | { format: "gephi-lite"; data: GephiLiteFileFormat; metadata?: undefined }
> {
  // Read the file content line by line
  // so if file is heavy, we don't need to full parse/check it
  let i = 0;
  const len = fileContent.length;
  function readNextLine(): string | null {
    if (i >= len) return null;
    const start = i;
    while (i < len && fileContent[i] !== "\n") {
      i++;
    }
    const line = fileContent.slice(start, i).replace(/\r$/, "");
    i++;
    return line;
  }

  const firstLine = readNextLine();
  if (firstLine?.startsWith("<?xml")) {
    const secondLine = readNextLine();

    // GEXF
    if (firstLine?.includes("<gexf") || secondLine?.includes("<gexf")) {
      return {
        format: "gexf",
        data: gexf.parse(Graph, fileContent, { allowUndeclaredAttributes: true, addMissingNodes: true }),
        metadata: {
          nodeFields: [
            {
              id: "label",
              itemType: "nodes",
              type: "text",
            },
            {
              id: "z",
              itemType: "nodes",
              type: "number",
            },
          ],
          edgeFields: [
            {
              id: "label",
              itemType: "edges",
              type: "text",
            },
          ],
        },
      };
    }

    // GRAPHML
    if (firstLine?.includes("<graphml") || secondLine?.includes("<graphml")) {
      return {
        format: "graphml",
        data: graphml.parse(Graph, fileContent, { addMissingNodes: true }),
      };
    }
  } else {
    const jsonContent = gephiLiteParse(fileContent);

    // Gephi lite
    if ("type" in jsonContent && jsonContent.type === "gephi-lite") {
      return parseGephiLiteJsonContent(jsonContent, opts);
    }

    // Graphology already deserialized thanks to `gephiLiteParse` with its `deserializer`
    if (jsonContent.nodes && jsonContent.edges && isFunction(jsonContent.nodes) && isFunction(jsonContent.edges)) {
      return {
        format: "graphology",
        data: jsonContent as Graph,
      };
    }

    // Graphology serialized (keept it in case)
    if (jsonContent.nodes && jsonContent.edges && isArray(jsonContent.nodes) && isArray(jsonContent.edges)) {
      return {
        format: "graphology",
        data: Graph.from(jsonContent),
      };
    }
  }
  throw new GephiLiteError("IMPORT_BAD_FILE_FORMAT", { fileName });
}

/**
 * Parse the content of the given file and returns its data and its type.
 */
export async function openAndParseFile(
  file: FileTypeWithoutFormat,
  opts: { force?: boolean } = {},
): Promise<
  | {
      format: "gexf" | "graphml" | "graphology";
      data: Graph;
      metadata?: { nodeFields?: FieldModel<"nodes">[]; edgeFields?: FieldModel<"edges">[] };
    }
  | { format: "gephi-lite"; data: GephiLiteFileFormat; metadata?: undefined }
> {
  const content = await getFileContent(file);
  return extractGraphFromFile(content, file.filename, opts);
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

/**
 * Parse a supposed gephi-lite file, and returns the data needed by `extractGraphFromFile`.
 * Per default this function check if the given file is compatible with the current version, andf not it throw an exception.
 * You can give the option `force` and so instead of importing a gephi-lite file, it will do its best to be casted it to a graphology one,
 * so the user can import it, even if we loose filters, appareance, ... data.
 * In the futur we should be able to use this function to cast an old file version into the current one.
 */
export function parseGephiLiteJsonContent<T extends { type: "gephi-lite" } & { [key: string]: object }>(
  jsonContent: T,
  opts: { force?: boolean } = {},
): Awaited<ReturnTypeOf<typeof extractGraphFromFile>> {
  // Check version compatibility
  let isCompatibleVersion = true;
  const version = parseVersion(jsonContent.version ? `${jsonContent.version}` : undefined);
  if (!version || version.major !== config.version.current.major || version.minor !== config.version.current.minor) {
    isCompatibleVersion = false;
  }

  if (!isCompatibleVersion && opts?.force !== true)
    throw new GephiLiteError("IMPORT_BAD_VERSION", { version: version?.toString() || "unknown" });

  if (opts.force) {
    let graph = new Graph();
    if ("graphDataset" in jsonContent) {
      const graphDataset = jsonContent["graphDataset"];
      if (
        "fullGraph" in graphDataset &&
        isObject(graphDataset.fullGraph) &&
        "nodes" in graphDataset.fullGraph &&
        "edges" in graphDataset.fullGraph
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graph = Graph.from(graphDataset.fullGraph as any);
      }

      // Merging node's attributs
      const nodeMapDataType = ["layout", "nodeRenderingData", "nodeData"] as const;
      for (const nodeMapData of nodeMapDataType) {
        if (has(graphDataset, nodeMapData) && isObject(graphDataset[nodeMapData])) {
          Object.entries(graphDataset[nodeMapData]).map(([key, data]) => {
            if (isObject(data) && graph.hasNode(key)) {
              graph.updateNodeAttributes(key, (prev) => ({ ...prev, ...data }));
            }
          });
        }
      }

      // Merging edge's attributs
      const edgeMapDataType = ["edgeRenderingData", "edgeData"] as const;
      for (const edgeMapData of edgeMapDataType) {
        if (has(graphDataset, edgeMapData) && isObject(graphDataset[edgeMapData])) {
          Object.entries(graphDataset[edgeMapData]).map(([key, data]) => {
            if (isObject(data) && graph.hasEdge(key)) {
              graph.updateEdgeAttributes(key, (prev) => ({ ...prev, ...data }));
            }
          });
        }
      }
    }

    return {
      format: "graphology",
      data: graph,
    };
  }

  return {
    format: "gephi-lite",
    data: jsonContent as unknown as GephiLiteFileFormat,
  };
}

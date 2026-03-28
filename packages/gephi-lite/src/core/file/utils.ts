import { FieldModel, gephiLiteParse } from "@gephi/gephi-lite-sdk";
import Graph from "graphology";
import gexf from "graphology-gexf/browser";
import graphml from "graphology-graphml/browser";

import { userAtom } from "../user";
import { parseEdgeListCSV } from "./csv-utils";
import { FileFormat, FileTypeWithoutFormat, GephiLiteFileFormat, fileFormatExt } from "./types";

/**
 * Decodes an ArrayBuffer as text, trying UTF-8 first and falling back to Shift_JIS.
 */
function decodeTextContent(buffer: ArrayBuffer): string {
  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    const sjisDecoder = new TextDecoder("shift_jis");
    return sjisDecoder.decode(buffer);
  }
}

/**
 * Returns the content of the given file.
 * If no content has been found, an exception raised.
 */
async function getFileContent(file: FileTypeWithoutFormat): Promise<string> {
  // Get file content
  let content: string | null = null;
  switch (file.type) {
    case "local": {
      const buffer = await file.source.arrayBuffer();
      content = decodeTextContent(buffer);
      break;
    }
    case "remote": {
      const response = await fetch(file.url);
      content = await response.text();
      break;
    }
    case "cloud": {
      const user = userAtom.get();
      if (!user) throw new Error("Cannot open a cloud file without to be connected");
      if (!user.provider) throw new Error("Cloud provider not available");
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
): Promise<
  | {
      format: "gexf" | "graphml" | "graphology" | "csv";
      data: Graph;
      metadata?: { nodeFields?: FieldModel<"nodes">[]; edgeFields?: FieldModel<"edges">[] };
    }
  | { format: "gephi-lite"; data: GephiLiteFileFormat; metadata?: undefined }
> {
  const extension = (fileName.split(".").pop() || "").toLowerCase();

  // Based on file extension, parse it to build a graphology
  switch (extension) {
    case "gexf":
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
    case "graphml":
      return {
        format: "graphml",
        data: graphml.parse(Graph, fileContent, { addMissingNodes: true }),
      };
    case "json": {
      const jsonContent = gephiLiteParse(fileContent);
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
    case "csv":
      return {
        format: "csv",
        data: parseEdgeListCSV(fileContent),
      };
  }
  throw new Error(`Extension ${extension} for file ${fileName} is not recognized`);
}

/**
 * Parse the content of the given file and returns its data and its type.
 */
export async function openAndParseFile(file: FileTypeWithoutFormat): Promise<
  | {
      format: "gexf" | "graphml" | "graphology" | "csv";
      data: Graph;
      metadata?: { nodeFields?: FieldModel<"nodes">[]; edgeFields?: FieldModel<"edges">[] };
    }
  | { format: "gephi-lite"; data: GephiLiteFileFormat; metadata?: undefined }
> {
  const content = await getFileContent(file);
  return extractGraphFromFile(content, file.filename);
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

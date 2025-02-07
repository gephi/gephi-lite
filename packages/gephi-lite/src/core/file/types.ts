import { AppearanceState } from "@gephi/gephi-lite-sdk";

import { CloudFile } from "../cloud/types";
import { FiltersState } from "../filters/types";
import { GraphDataset } from "../graph/types";

/**
 * A serializable structure, to allow Gephi Lite to load and save graphs, with their surrounding context.
 * This includes:
 * - The full graph dataset
 * - The filters state
 * - The appearance state
 */
export type GephiLiteFileFormat = {
  type: "gephi-lite";
  version: string;
  graphDataset: GraphDataset;
  filters: FiltersState;
  appearance: AppearanceState;
};

export type FileFormat = "gexf" | "gephi-lite" | "graphology" | "graphml";
export const fileFormatExt: Record<FileFormat, string> = {
  gexf: "gexf",
  "gephi-lite": "json",
  graphology: "json",
  graphml: "graphml",
};

export interface AbstractFile {
  type: "local" | "remote" | "cloud";
  format: FileFormat;
  filename: string;
}
export interface RemoteFile extends AbstractFile {
  type: "remote";
  url: string;
}
export interface LocalFile extends AbstractFile {
  type: "local";
  updatedAt: Date;
  size: number;
  source: File;
}

export type FileType = CloudFile | RemoteFile | LocalFile;
export type FileTypeWithoutFormat = Omit<CloudFile, "format"> | Omit<RemoteFile, "format"> | Omit<LocalFile, "format">;

export type FileState = {
  current: FileType | null;
  recentFiles: Array<FileType>;
  status: { type: "idle" } | { type: "loading" } | { type: "error"; message?: string };
};

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

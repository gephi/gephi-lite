import { AppearanceState } from "@gephi/gephi-lite-sdk";

import { CloudFile } from "../cloud/types";
import { FiltersState } from "../filters/types";
import { GraphDataset } from "../graph/types";
import { Session } from "../session/types";

/**
 * A serializable structure, to allow Gephi Lite to load and save graphs, with their surrounding context.
 * This includes:
 * - The full graph dataset
 * - The filters state
 * - The appearance state
 * - The session (layouts & metrics parameters)
 */
export type GephiLiteFileFormat = {
  type: "gephi-lite";
  version: string;
  graphDataset: GraphDataset;
  filters: FiltersState;
  appearance: AppearanceState;
  // Optional: files exported before this field existed simply don't carry it (backward compatible).
  session?: Session;
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
  // Whether the graph dataset, appearance or filters have changed since the current file was opened/saved:
  isDirty: boolean;
  // Fingerprint of the remote content as of the last open/save of the current cloud file, used by
  // the freshness guard to tell a real remote change from a timestamp that merely moved (see
  // core/cloud/remoteContent). Persisted with the rest of the file state, so it survives a reload.
  remoteContentFingerprint: string | null;
};

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

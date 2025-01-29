import { AppearanceState } from "@gephi/gephi-lite-sdk";

import { CloudFile } from "../cloud/types";
import { FiltersState } from "../filters/types";
import { GraphDataset } from "../graph/types";

/**
 * Type for the file format of gephi-lite.
 * We save :
 *  - the gephi-lite version for checking compatibilities in the futur
 *  - the full graph with its metadata
 *  - filters
 *  - appearance
 *  - selection
 */
export type GephiLiteFileFormat = {
  type: "gephi-lite";
  version: string;
  graphDataset: GraphDataset;
  filters: FiltersState;
  appearance: AppearanceState;
};

export interface AbstractFile {
  type: string;
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

export type FileState = {
  current: FileType | null;
  recentFiles: Array<FileType>;
  status: { type: "idle" } | { type: "loading" } | { type: "error"; message?: string };
};

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

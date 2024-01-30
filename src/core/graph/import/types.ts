import { CloudFile } from "../../cloud/types";

export interface GraphFile {
  type: string;
  filename: string;
}
export interface RemoteFile extends GraphFile {
  type: "remote";
  url: string;
}
export interface LocalFile extends GraphFile {
  type: "local";
  updatedAt: Date;
  size: number;
  source: File;
}
export type GraphOrigin = CloudFile | RemoteFile | LocalFile | null;

export type ImportState = { type: "idle" } | { type: "loading" } | { type: "error"; message?: string };

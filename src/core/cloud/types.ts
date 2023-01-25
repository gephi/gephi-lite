import { GraphFile } from "../graph/types";

export interface CloudFile extends GraphFile {
  type: "cloud";
  id: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  size: number;
  webUrl?: string;
}

export interface CloudProvider {
  /**
   * type is use for TS but also displayed on the application
   */
  type: string;

  /**
   * Make a call to the provider to find files
   */
  getFiles(skip?: number, limit?: number): Promise<Array<CloudFile>>;

  /**
   * Make a call to retrieve the cloudfile by its id.
   */
  getFile(id: string): Promise<CloudFile | null>;

  /**
   * Make a call to retrieve the content of the file.
   */
  getFileContent(id: string): Promise<string>;

  /**
   * Create a file.
   * For dev, filename can lack the '.gexf', you must add it if missing
   */
  createFile(file: Pick<CloudFile, "filename" | "description" | "isPublic">, content: string): Promise<CloudFile>;

  /**
   * Save/Update a file.
   */
  saveFile(file: CloudFile, content: string): Promise<CloudFile>;

  /**
   * Delete a file.
   */
  deleteFile(file: CloudFile): Promise<void>;

  /**
   * Serialize the cloud provider.
   * It is used when we save the user (with the provider) in the localstorage
   */
  serialize(): string;
}

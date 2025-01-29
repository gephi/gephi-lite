import { AbstractFile } from "../file/types";

export interface CloudFile extends AbstractFile {
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
   * Icon is use for TS but also displayed on the application
   */
  icon: JSX.Element;

  /**
   * Make a call to the provider to find files
   */
  getFiles(skip?: number, limit?: number): Promise<Array<Omit<CloudFile, "format">>>;

  /**
   * Make a call to retrieve the cloudfile by its id.
   */
  getFile(id: string): Promise<Omit<CloudFile, "format"> | null>;

  /**
   * Make a call to retrieve the content of the file.
   */
  getFileContent(id: string): Promise<string>;

  /**
   * Create a file.
   */
  createFile(
    file: Pick<CloudFile, "filename" | "description" | "isPublic" | "format">,
    content: string,
  ): Promise<CloudFile>;

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

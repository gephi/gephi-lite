export interface CloudFile {
  id: string;
  description?: string;
  filename: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  size: number;
  webUrl?: string;
}

export interface CloudProvider {
  type: string;
  getFiles(): Promise<Array<CloudFile>>;
  getFile(id: string): Promise<CloudFile | null>;
  getFileContent(id: string): Promise<string>;
  saveFile(file: Pick<CloudFile, "id" | "filename">, content: string): Promise<CloudFile>;
  deleteFile(id: string): Promise<void>;
  serialize(): string;
}

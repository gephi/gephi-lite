export interface CloudProvider {
  getFiles(): Promise<File | null>;
  getFile(): Promise<File | null>;
  saveFile(): Promise<File>;
  deleteFile(): Promise<void>;
}

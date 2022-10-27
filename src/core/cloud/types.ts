export interface CloudUser {
  id: string;
  name: string;
  avatar?: string;
  token: string;
}

// interface CloudProvider {
//   getFiles(): Promise<File | null>;
//   getFile(): Promise<File | null>;
//   saveFile(): Promise<File>;
//   deleteFile(): Promise<void>;
// }

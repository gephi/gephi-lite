import { CloudProvider } from "../cloud/types";

export interface User {
  id: string;
  name: string;
  avatar?: string;
  provider: CloudProvider;
}

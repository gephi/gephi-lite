import MiniSearch from "minisearch";

import { ItemType } from "../types";

export type Document = { itemId: string; id: string; type: ItemType; label?: string | null } & {
  [key: string]: unknown;
};
export interface SearchState {
  index: MiniSearch<Document>;
}

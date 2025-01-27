import { ItemType } from "../types";

export interface SelectionState {
  type: ItemType;
  items: Set<string>;
}

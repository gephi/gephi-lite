import { ItemType } from "@gephi/gephi-lite-sdk";
import { ColumnSizingTableState, SortingTableState } from "@tanstack/table-core";

export interface DataTableState {
  type: ItemType;
  search: string;
  dataTableState: ColumnSizingTableState & SortingTableState;
}

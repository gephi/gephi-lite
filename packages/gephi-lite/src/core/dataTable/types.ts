import { ItemType } from "@gephi/gephi-lite-sdk";
import { ColumnSizingTableState } from "@tanstack/table-core";

export interface DataTableState {
  type: ItemType;
  search: string;
  columnsState: ColumnSizingTableState;
}

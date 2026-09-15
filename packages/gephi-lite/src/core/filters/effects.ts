import { serializeFiltersState } from "@gephi/gephi-lite-sdk";

import { sessionStorage } from "../../utils/storage";
import { filtersAtom } from "./atom";

filtersAtom.bind((filtersState) => {
  sessionStorage.setItem("filters", serializeFiltersState(filtersState));
});

import { gephiLiteStringify } from "@gephi/gephi-lite-sdk";

import { fileAtom } from "./atom";

fileAtom.bind((file) => {
  localStorage.setItem("file", gephiLiteStringify(file));
});

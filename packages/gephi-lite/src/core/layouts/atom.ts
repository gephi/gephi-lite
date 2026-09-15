import { atom, derivedAtom } from "@ouestware/atoms";
import { pick } from "lodash";

import { LayoutState } from "./types";
import { getLocalStorageLayoutState } from "./utils";

export const layoutStateAtom = atom<LayoutState>(getLocalStorageLayoutState());

export const gridEnabledAtom = derivedAtom(layoutStateAtom, (value) => pick(value.quality, "enabled"), {
  checkOutput: true,
});

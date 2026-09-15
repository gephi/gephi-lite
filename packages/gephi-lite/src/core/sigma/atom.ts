import { atom } from "@ouestware/atoms";
import Graph from "graphology";
import { Sigma } from "sigma";

import { SigmaState } from "./types";
import { getEmptySigmaState } from "./utils";

// creating a dummy sigma instance to init the atom
const INITIAL_SIGMA_INSTANCE = new Sigma(new Graph(), document.createElement("div"), {
  allowInvalidContainer: true,
});
export type GephiLiteSigma = typeof INITIAL_SIGMA_INSTANCE;
export const sigmaAtom = atom(INITIAL_SIGMA_INSTANCE);
export const sigmaStateAtom = atom<SigmaState>(getEmptySigmaState());

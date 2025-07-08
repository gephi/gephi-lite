import { Producer, atom, producerToAction } from "@ouestware/atoms";
import { without } from "lodash";

import { ItemType } from "../types";
import { GraphSelectionMode, SelectionState } from "./types";
import { getEmptySelectionState } from "./utils";

/**
 * Producers:
 * **********
 */
export const select: Producer<SelectionState, [{ type: ItemType; items: Set<string>; replace?: boolean }]> = ({
  type,
  items,
  replace,
}) => {
  return (state) => ({
    ...state,
    type,
    items: state.type !== type || replace ? items : new Set<string>([...Array.from(state.items), ...Array.from(items)]),
  });
};

export const unselect: Producer<SelectionState, [{ type: ItemType; items: Set<string> }]> = ({ type, items }) => {
  return (state) => ({
    ...state,
    type,
    items:
      state.type !== type ? new Set<string>() : new Set<string>(without(Array.from(state.items), ...Array.from(items))),
  });
};

export const toggle: Producer<SelectionState, [{ type: ItemType; item: string }]> = ({ type, item }) => {
  return (state) => ({
    ...state,
    type,
    items:
      state.type !== type
        ? new Set([item])
        : state.items.has(item)
          ? new Set(without(Array.from(state.items), item))
          : new Set(Array.from(state.items).concat(item)),
  });
};

export const setMode: Producer<SelectionState, [GraphSelectionMode]> = (mode) => {
  return (state) => ({ ...state, graphSelectionMode: mode });
};

export const emptySelection: Producer<SelectionState, []> = () => {
  return (state) => ({ ...state, items: new Set() });
};

export const reset: Producer<SelectionState, []> = () => {
  return () => getEmptySelectionState();
};

/**
 * Public API:
 * ***********
 */
export const selectionAtom = atom<SelectionState>(getEmptySelectionState());

export const selectionActions = {
  select: producerToAction(select, selectionAtom),
  unselect: producerToAction(unselect, selectionAtom),
  toggle: producerToAction(toggle, selectionAtom),
  setMode: producerToAction(setMode, selectionAtom),
  emptySelection: producerToAction(emptySelection, selectionAtom),
  reset: producerToAction(reset, selectionAtom),
} as const;

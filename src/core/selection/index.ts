import { without } from "lodash";

import { ItemType } from "../types";
import { atom } from "../utils/atoms";
import { SelectionState } from "./types";
import { getEmptySelectionState } from "./utils";
import { Producer, producerToAction } from "../utils/producers";

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
  reset: producerToAction(reset, selectionAtom),
} as const;

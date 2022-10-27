import React, { FC, ReactNode, useEffect, useState } from "react";

import { Reducer, reducify, ValueOrReducer } from "./reducers";

/**
 * Useful types:
 * *************
 */
export interface AtomHandler<T> {
  (value: T, previousValue: T): void;
}
export interface AtomReducer<T> {
  (value: T): T;
}
export interface AtomSetter<T> {
  (v: T | AtomReducer<T>): void;
}

export interface ReadableAtom<T> {
  get: () => T;
  bind: (handler: AtomHandler<T>) => void;
  unbind: (handler: AtomHandler<T>) => void;
}
export interface WritableAtom<T> extends ReadableAtom<T> {
  set: AtomSetter<T>;
}

/**
 * This function takes an initial value and returns a writable atom.
 */
export function atom<T>(initialValue: T): WritableAtom<T> {
  let value: T = initialValue;
  let handlers: AtomHandler<T>[] = [];

  return {
    get() {
      return value;
    },
    set(v: T | AtomReducer<T>): void {
      const previousValue = value;
      if (typeof v === "function") value = (v as AtomReducer<T>)(value);
      else value = v;
      handlers.forEach((handler) => handler(value, previousValue));
    },
    bind(handler: AtomHandler<T>) {
      handlers.push(handler);
    },
    unbind(handler: AtomHandler<T>) {
      handlers = handlers.filter((h) => h !== handler);
    },
  };
}

/**
 * This function takes an array of atom dependencies and an extractor function, and returns a read-only atom.
 */
interface DerivedAtomOptions {
  checkInput?: boolean;
  checkOutput?: boolean;
}
export function derivedAtom<D, T>(
  atom: ReadableAtom<T>,
  extractor: (value: T) => D,
  options?: DerivedAtomOptions,
): ReadableAtom<D>;
export function derivedAtom<D, T1, T2>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>],
  extractor: (v1: T1, v2: T2) => D,
  options?: DerivedAtomOptions,
): ReadableAtom<D>;
export function derivedAtom<D, T1, T2, T3>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>, ReadableAtom<T3>],
  extractor: (v1: T1, v2: T2, v3: T3) => D,
  options?: DerivedAtomOptions,
): ReadableAtom<D>;
export function derivedAtom<D>(
  atoms: ReadableAtom<any> | ReadableAtom<any>[],
  extractor: (...args: any[]) => D,
  options: DerivedAtomOptions = {},
): ReadableAtom<D> {
  const atomsArray = Array.isArray(atoms) ? atoms : [atoms];
  let lastInput: any[] = atomsArray.map((atom) => atom.get());
  let value: D = extractor(...lastInput);
  let handlers: AtomHandler<D>[] = [];

  atomsArray.map((atom) =>
    atom.bind(() => {
      const input = atomsArray.map((atom) => atom.get());

      if (!options.checkInput || input.some((v, i) => v !== lastInput[i])) {
        lastInput = input;
        const newValue = extractor(...atomsArray.map((atom) => atom.get()));

        if (!options.checkOutput || newValue !== value) {
          const previousValue = value;
          value = newValue;
          handlers.forEach((handler) => handler(value, previousValue));
        }
      }
    }),
  );

  return {
    get() {
      return value;
    },
    bind(handler: AtomHandler<D>) {
      handlers.push(handler);
    },
    unbind(handler: AtomHandler<D>) {
      handlers = handlers.filter((h) => h !== handler);
    },
  };
}

/**
 * This function binds a handler on an extracted value of atoms, and only executes when the extracted value changes.
 * It returns a function you a call to unbind the handler from the given atoms.
 */
export function bindOn<D, T>(
  atom: ReadableAtom<T>,
  extractor: (value: T) => D,
  handler: (value: D) => void,
): () => void;
export function bindOn<D, T1, T2>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>],
  extractor: (v1: T1, v2: T2) => D,
  handler: (value: D) => void,
): () => void;
export function bindOn<D, T1, T2, T3>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>, ReadableAtom<T3>],
  extractor: (v1: T1, v2: T2, v3: T3) => D,
  handler: (value: D) => void,
): () => void;
export function bindOn<D>(
  atoms: ReadableAtom<any> | ReadableAtom<any>[],
  extractor: (...args: any[]) => D,
  handler: (value: D) => void,
): () => void {
  const atomsArray = Array.isArray(atoms) ? atoms : [atoms];
  let value: D = extractor(...atomsArray.map((atom) => atom.get()));
  const atomHandler = () => {
    const newValue = extractor(...atomsArray.map((atom) => atom.get()));
    if (newValue !== value) {
      value = newValue;
      handler(newValue);
    }
  };
  atomsArray.map((atom) => atom.bind(atomHandler));

  return () => atomsArray.map((atom) => atom.unbind(atomHandler));
}

/**
 * This function returns a setter for a given key inside an atom.
 */
export function buildSetter<T extends Object, Key extends keyof T>(
  atom: WritableAtom<T>,
  key: Key,
): (input: ValueOrReducer<T[Key]>) => void {
  return reducify((reducer: Reducer<T[Key]>) => {
    atom.set((state) => ({ ...state, [key]: reducer(state[key]) }));
  });
}

/**
 * This function returns a getter for a given key inside an atom.
 */
export function buildGetter<T extends Object, Key extends keyof T>(atom: ReadableAtom<T>, key: Key): () => T[Key] {
  return () => atom.get()[key];
}

/**
 * This React hook allow reading and writing a writable atom in a React component (similarly to useState).
 */
export function useAtom<T>(atom: WritableAtom<T>): [T, AtomSetter<T>] {
  const [value, setValue] = useState<T>(atom.get());

  useEffect(() => {
    const v = atom.get();
    if (v !== value) setValue(v);

    atom.bind(setValue);
    return () => atom.unbind(setValue);
  }, [atom, setValue]);

  return [value, atom.set];
}

/**
 * This React hook allow reading a readable atom in a React component.
 */
export function useReadAtom<T>(atom: ReadableAtom<T>): T;
export function useReadAtom<T, K extends keyof T>(atom: ReadableAtom<T>, key: K): T[K];
export function useReadAtom<T, K extends keyof T>(atom: ReadableAtom<T>, key?: K): T | T[K] {
  const [value, setValue] = useState<T>(atom.get());

  useEffect(() => {
    const v = atom.get();
    if (v !== value) setValue(atom.get());

    atom.bind(setValue);
    return () => atom.unbind(setValue);
  }, [atom, setValue]);

  return key ? value[key] : value;
}

/**
 * This function takes an atom as input, and returns a proper React context, and a component to use at the root that
 * will keep the context value up to date.
 */
export function buildContext<T>(atom: ReadableAtom<T>) {
  const Context = React.createContext<T>(atom.get());

  const ContextComponent: FC<{ children: ReactNode }> = ({ children }) => {
    const [value, setValue] = useState<T>(atom.get());

    useEffect(() => {
      const v = atom.get();
      if (v !== value) setValue(atom.get());

      atom.bind(setValue);
      return () => atom.unbind(setValue);
    }, [atom, setValue]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  return {
    context: Context,
    component: ContextComponent,
  };
}

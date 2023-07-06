/* eslint-disable react-hooks/exhaustive-deps */
import { debounce as debounceFn, isEqual } from "lodash";
import { useEffect, useState } from "react";

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

      if (value !== previousValue) {
        handlers.forEach((handler) => handler(value, previousValue));
      }
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
  checkInput: boolean;
  checkOutput: boolean;
  debounce: boolean;
}
export function derivedAtom<D, T>(
  atom: ReadableAtom<T>,
  extractor: (value: T, previousValue: D | undefined) => D,
  options?: Partial<DerivedAtomOptions>,
): ReadableAtom<D>;
export function derivedAtom<D, T1, T2>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>],
  extractor: (v1: T1, v2: T2, previousValue: D | undefined) => D,
  options?: Partial<DerivedAtomOptions>,
): ReadableAtom<D>;
export function derivedAtom<D, T1, T2, T3>(
  atoms: [ReadableAtom<T1>, ReadableAtom<T2>, ReadableAtom<T3>],
  extractor: (v1: T1, v2: T2, v3: T3, previousValue: D | undefined) => D,
  options?: Partial<DerivedAtomOptions>,
): ReadableAtom<D>;
export function derivedAtom<D>(
  atoms: ReadableAtom<any> | ReadableAtom<any>[],
  extractor: (...args: any[]) => D,
  options: Partial<DerivedAtomOptions> = {},
): ReadableAtom<D> {
  const atomsArray = Array.isArray(atoms) ? atoms : [atoms];
  let lastInput: any[] = atomsArray.map((atom) => atom.get());
  let value: D = extractor(...lastInput);
  let handlers: AtomHandler<D>[] = [];

  const { checkInput, checkOutput, debounce } = {
    checkInput: true,
    checkOutput: true,
    debounce: false,
    ...options,
  };

  let extract = () => {
    const input = atomsArray.map((atom) => atom.get());

    if (!checkInput || input.some((v, i) => !isEqual(v, lastInput[i]))) {
      lastInput = input;
      const newValue = extractor(...atomsArray.map((atom) => atom.get()), value);

      if (!checkOutput || !isEqual(newValue, value)) {
        const previousValue = value;
        value = newValue;
        handlers.forEach((handler) => handler(value, previousValue));
      }
    }
  };

  if (debounce) extract = debounceFn(extract, 100);

  atomsArray.map((atom) => atom.bind(extract));

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
 * This React hook allow writing a writable atom in a React component. It prevents triggering excess renderings when the
 * caller does not need to read the value.
 */
export function useWriteAtom<T>(atom: WritableAtom<T>): AtomSetter<T> {
  const [value, setValue] = useState<T>(atom.get());

  useEffect(() => {
    const v = atom.get();
    if (v !== value) setValue(v);

    atom.bind(setValue);
    return () => atom.unbind(setValue);
  }, [atom, setValue]);

  return atom.set;
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

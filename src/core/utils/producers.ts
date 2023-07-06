import { WritableAtom } from "./atoms";

export type Reducer<T> = (v: T) => T;

/**
 * A Producer is a function that returns a reducer. These are easy to test, and
 * it is easy to create mutating actions from them as well.
 */
export type Producer<T, Args extends unknown[] = []> = (...args: Args) => Reducer<T>;
export type MultiProducer<Ts extends Array<unknown>, Args extends unknown[] = []> = (...args: Args) => {
  [K in keyof Ts]: Reducer<Ts[K]>;
};

/**
 * Takes a producer and an atom, and returns an action that actually mutates the
 * atom.
 * This allows writing the logic as unit-testable producers, but spread through
 * the code simple actions.
 */
export function producerToAction<T, Args extends unknown[] = []>(producer: Producer<T, Args>, atom: WritableAtom<T>) {
  return (...args: Args) => {
    atom.set(producer(...args));
  };
}
export function multiproducerToAction<Ts extends Array<unknown>, Args extends unknown[] = []>(
  producer: MultiProducer<Ts, Args>,
  atoms: {
    [K in keyof Ts]: WritableAtom<Ts[K]>;
  },
) {
  return (...args: Args) => {
    const reducers = producer(...args);
    atoms.forEach((atom, i) => atom.set(reducers[i]));
  };
}

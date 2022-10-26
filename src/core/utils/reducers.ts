import { WritableAtom } from './atoms';

export type Reducer<T> = (v: T) => T;

export type ValueOrReducer<T> = T | Reducer<T>;

/**
 * Takes a function that takes a reducer as input, and returns one that accepts
 * both a reducer or directly a value:
 */
export function reducify<T>(fn: (reducer: Reducer<T>) => void): (input: ValueOrReducer<T>) => void {
  return (input: ValueOrReducer<T>) => {
    const reducer = typeof input === 'function' ? (input as Reducer<T>) : () => input;
    return fn(reducer);
  };
}

/**
 * A Producer is a function that returns a reducer. These are easy to test, and
 * it is easy to create mutating actions from them as well.
 */
export type Producer<T, Args extends unknown[] = []> = (...args: Args) => Reducer<T>;

/**
 * Takes a producer and an atom, and returns an action that actually mutates the
 * atom.
 * This allows writing the logic as unit-testable producers, but spread through
 * the code simple actions.
 */
export function producerToAction<T, Args extends unknown[] = []>(
  producer: Producer<T, Args>,
  atom: WritableAtom<T>
) {
  return (...args: Args) => {
    atom.set(producer(...args));
  };
}

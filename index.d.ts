export as namespace reaffect

export type Callback<T> = (
  value: T,
  done?: boolean
) => void

export type Effect<T> = [
  (next: Callback<T>, ...args: any[]) => () => void,
  ...any[],
]

/**
 * Creates an effect store, fed by the given generator.
 *
 * The generator's "next" method is called once, which shall return an array of
 * {@link Effect}s to activate.
 * Afterwards, whenever an effect invokes its {@link Callback} with a value,
 * "next" is called with such value, except if "done" is passed to the
 * callback, in which case the effect is cancelled instead.
 *
 * @param gen The generator or iterator-like object that feeds the store.
 * @param hash A function that returns a string representation of an effect.
 * By default, it is {@link Function.toString} for functions and
 * {@link JSON.stringify} for other types.
 */
export default function reaffect<T>(
  gen: { next: (value: T) => (Effect<T> | false)[] },
  hash?: (effect: Effect<T>) => string
): void

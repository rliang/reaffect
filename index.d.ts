export as namespace reaffect

export type Dispatcher<T> = (value: T, done?: boolean) => void

export type Effect<T> = [(dispatch: Dispatcher<T>, ...args: any[]) => () => void, ...any[]]

export type Engine<T> = {next: (value: T) => {value: (Effect<T> | false)[], done?: boolean}}

/**
 * Creates an effect store, controlled by the given engine.
 *
 * The engine's "next" method is called once, which shall return an array of
 * {@link Effect}s to activate.
 * Afterwards, whenever an effect invokes its {@link Dispatcher} with a value,
 * "next" is called with such value, except if "done" is passed to the
 * callback, in which case the effect is cancelled instead.
 *
 * @param gen The iterator-like object that feeds the store.
 * @param isEqual A function that compares {@link Effect}s for equality.
 */
export function reaffect<T>(gen: Engine<T>, isEqual?: (a: any[], b: any[]) => boolean): void

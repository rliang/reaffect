export as namespace reaffect

export type Effect<T> =
  [(...args: any[]) => AsyncIterator<T>, ...any[]]

export type Store =
  <T>(...effects: (Effect<T> | false)[]) => Promise<T>

export default function createStore(hash?: (effect: Effect<any>) => string): Store

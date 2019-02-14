export as namespace reaffect

export type Effect<T> = [
  (
    next: (value: T, done?: boolean) => void,
    ...args: any[]
  ) => () => void,
  ...any[],
]

export default function reaffect<T>(
  gen: { next: (value: T) => (Effect<T> | false)[] },
  hash?: (effect: Effect<T>) => string
): void

import { Dispatcher, Effect, Engine } from '../..'

export default function WithLog<T,>(dispatch: Dispatcher<T>, f, ...args) {
  const str = `[${[f.name, ...args].join(',')}]`
  console.log(str, 'started')
  const cancel = f((value, done) => {
    if (!done)
      console.log(str, 'sent', `${value}`)
    dispatch(value, done)
  }, ...args)
  return () => { cancel(); console.log(str, 'cancelled') }
}

export const withLogAll = <T,>(gen: Engine<T>) => ({
  next(v: T) {
    let { done, value } = gen.next(v)
    return { done, value: done ? undefined : value.map(e => e && [WithLog, ...e] as Effect<T>) }
  }
})

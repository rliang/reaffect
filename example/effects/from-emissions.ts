import { Dispatcher } from '../..'

type CallbackHandler<T> = (event: string, cb: (value: T) => void) => void

type Emitter<T>
  = { addListener: CallbackHandler<T>, removeListener: CallbackHandler<T> }
  | { addEventListener: CallbackHandler<T>, removeEventListener: CallbackHandler<T> }

export default function fromEmissions<M, N>(
  event: string,
  format: (src: Emitter<M>, value: M) => N,
) {
  return function EmitterEvent(dispatch: Dispatcher<N>, src: Emitter<M>) {
    const cb = (data: M) => dispatch(format(src, data))
    // @ts-ignore
    ;(src.addListener || src.addEventListener).call(src, event, cb)
    // @ts-ignore
    return () => (src.removeListener || src.removeEventListener).call(src, event, cb)
  }
}

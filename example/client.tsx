import * as React from 'react'
import { render } from 'react-dom'
import { reaffect, Dispatcher, Effect, Engine } from '..'
import WithLog from './effects/with-log'
import fromEmissions from './effects/from-emissions'

type Msg
  = { kind: 'open', src: WebSocket }
  | { kind: 'error', src: WebSocket, error: any }
  | { kind: 'message', src: WebSocket, data: string }
  | { kind: 'close', src: WebSocket }
  | { kind: 'timeout' }

const TimeoutEvent = (dispatch: Dispatcher<Msg>, n) => {
  const id = setTimeout(dispatch, n, {kind: 'timeout'})
  return () => clearTimeout(id)
}

const OpenEvents = fromEmissions<any, Msg>('open',
  (src: WebSocket) => ({kind: 'open', src}))

const ErrorEvents = fromEmissions<any, Msg>('error',
  (src: WebSocket, error) => ({kind: 'error', src, error}))

const MessageEvents = fromEmissions<MessageEvent, Msg>('message',
  (src: WebSocket, event) => ({kind: 'message', src, data: event.data}))

const CloseEvents = fromEmissions<any, Msg>('close',
  (src: WebSocket) => ({kind: 'close', src}))

const Render = (dispatch: Dispatcher<Msg>, root: Element, count: number) => {
  render((
    <div>
      <div>{count}</div>
    </div>
  ), root);
  return () => dispatch = () => {}
}

function* connect() {
  // connects to a websocket server, with backoff algorithm
  for (let timeout = 0; true; timeout += timeout < 100000 ? 10000 : 0) {
    const socket = new WebSocket('ws://localhost:1234')
    const msg = (
      yield [OpenEvents, ErrorEvents].map(e => [e, socket] as Effect<Msg>)
    ) as Msg
    if (msg.kind === 'open')
      return socket
    yield [[TimeoutEvent, timeout] as Effect<Msg>]
  }
}

function* main(root: Element) { 
  // @ts-ignore
  const socket: WebSocket = yield* connect()
  while (true) {
    const msg = (
      yield [MessageEvents, CloseEvents].map(e => [e, socket] as Effect<Msg>)
    ) as Msg
    switch (msg.kind) {
      case 'message':
        console.log(msg)
        break
      case 'close':
        socket.close()
        return
    }
  }
}

function* app(root: Element) { 
  while (true)
    // @ts-ignore
    yield* main(root)
}

reaffect<Msg>(app(document.getElementById('root')))

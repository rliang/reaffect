import * as http from 'http'
import * as WebSocket from 'ws'
import * as Bundler from 'parcel-bundler'
import { reaffect, Dispatcher, Effect, Engine } from '..'
import { withLogAll } from './effects/with-log'
import fromEmissions from './effects/from-emissions'

type Msg
  = { kind: 'connection', socket: WebSocket }
  | { kind: 'message', src: WebSocket, data: string }
  | { kind: 'close', src: WebSocket }

const ConnectionEvents = fromEmissions<WebSocket, Msg>('connection',
  (_: WebSocket.Server, socket: WebSocket) => ({kind: 'connection', socket}))

const MessageEvents = fromEmissions<WebSocket.Data, Msg>('message',
  (src: WebSocket, data: any) => ({kind: 'message', src, data}))

const CloseEvents = fromEmissions<any, Msg>('close',
  (src: WebSocket) => ({kind: 'close', src}))

function* main(wss: WebSocket.Server) {
  const sockets = new Set<WebSocket>()
  while (true) {
    const msg = (
      yield [
        [ConnectionEvents, wss] as Effect<Msg>,
        ...Array.from(sockets).map(ws => [MessageEvents, ws] as Effect<Msg>),
        ...Array.from(sockets).map(ws => [CloseEvents, ws] as Effect<Msg>),
      ]
    ) as Msg
    switch (msg.kind) {
      case 'connection':
        sockets.add(msg.socket)
        msg.socket.send('hi')
        break
      case 'message':
        for (const s of Array.from(sockets))
          s.send(msg.data)
        break
      case 'close':
        sockets.delete(msg.src)
        break
    }
  }
}

const server = http.createServer(new Bundler('./index.html').middleware())
reaffect<Msg>(withLogAll(main(new WebSocket.Server({ server }))))
server.listen(1234)

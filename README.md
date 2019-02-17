# Reaffect
[![npm](https://img.shields.io/npm/v/reaffect.svg)](https://www.npmjs.org/package/reaffect)
[![size](https://img.badgesize.io/rliang/reaffect/master/index.js.png?compression=gzip)](https://github.com/ngryman/badge-size)
[![deps](https://david-dm.org/rliang/reaffect/status.svg)](https://david-dm.org/rliang/reaffect)

Reaffect is a reactive side-effect container for Javascript apps.

It allows building apps where side-effects are
a function of the current state of the application,
and separate from business logic.

[API](index.d.ts)

[Examples](#examples)

## [Getting started](#getting-started)

### Installation

```sh
npm i reaffect
```

### Defining effects

An effect is just a function which:

* Takes a callback as the first argument, which, in turn:
  * Takes a value as the first argument;
  * Takes whether the effect is completed as the second argument.
* Returns another function which cancels the effect.

```js
function SendEachSecond(send, valueToSend) {
  const id = setInterval(() => send(valueToSend, false), 1000)
  return () => clearInterval(id)
}
```

Effects are composable:

```js
const WithLog = (send, f, ...args) => {
  const effect = JSON.stringify([f.name, ...args])
  console.log(`${effect} started`)
  const cancel = f((value, done) => {
    if (!done)
      console.log(`${effect} sent "${value}"`)
    send(value, done)
  }, ...args)
  return () => { cancel(); console.log(`${effect} cancelled`) }
}
```

### Storing effects

Storing effects and retrieving their emitted values
can be done inside of a generator,
or any object with a `next` method.

```js
import reaffect from 'reaffect'

function* app() { 
  while (true) {
    const msg = yield [
      [SendEachSecond, 'hello'],
      [WithLog, SendEachSecond, 'world'],
    ]
    console.log(msg)
  }
}

reaffect(app())
```

Generators are composable:

```js
function* screen1() { 
  while (true) {
    const msg = yield [/* ... */]
    if (msg === 'screen2')
      yield* screen2()
  }
}
```

See below for a more practical usage.

## [Examples](#examples)

### React counter

```js
import React from 'react'
import { render } from 'react-dom'
import reaffect from 'reaffect'

const SendEverySecond = (send, value) =>
  clearInterval.bind(this, setInterval(send, 1000, value))

const Render = (send, state) => {
  render(
    <div>
      <div>{state.count}</div>
      <button onClick={() => send('increase')}>+1</button>
      <button onClick={() => send('decrease')}>-1</button>
    </div>
  , document.getElementById('root')))
  return () => send = () => {}
}

function* app() { 
  let state = {count: 0}
  while (true) {
    const msg = yield [
      [Render, state], 
      count > 0 && [SendEachSecond, 'decrease'],
      count < 0 && [SendEachSecond, 'increase'],
    ]
    switch (msg) {
      case 'increase':
        state = {...state, count: count + 1}
        break
      case 'decrease':
        state = {...state, count: count - 1}
        break
    }
  }
}

reaffect(app())
```

## Compatibility with Async Iterators

Although async iterators are not really immediately cancellable,
`.return()` will do it after the next promise resolves.

```js
const WrapAsyncIterator = (send, f, ...args) => {
  const it = (async () => {
    for await (const v of f(...args))
      send(v)
    send(null, true)
  })()
  return () => it.return()
}
```

## [Acknowledgements](#acknowledgements)

This library is inspired by
[hyperapp](https://github.com/jorgebucaran/hyperapp/tree/V2)
and [Elm](https://elm-lang.org).

## [License](#license)

MIT

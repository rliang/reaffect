# Reaffect
[![npm](https://img.shields.io/npm/v/reaffect.svg)](https://www.npmjs.org/package/reaffect)
[![size](https://img.badgesize.io/rliang/reaffect/master/index.js.png?compression=gzip)](https://github.com/ngryman/badge-size)

Reaffect is a reactive side-effect container for Javascript apps.

It allows building apps where side-effects are
a function of the current state of the application,
and separate from business logic.

## [Getting started](#getting-started)

[Skip to Examples](#examples)

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
function YieldEachSecond(send, valueToSend) {
  const id = setInterval(() => send(valueToSend, false), 1000)
  return () => clearInterval(id)
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
      [YieldEachSecond, 'hello'],
      [YieldEachSecond, 'world'],
    ]
    console.log(msg)
  }
}

reaffect(app())
```

See below for a more practical usage.

## [Examples](#examples)

### React counter

```js
import React from 'react'
import { render } from 'react-dom'
import reaffect from 'reaffect'

const YieldEverySecond = (send, value) =>
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
      count > 0 && [YieldEachSecond, 'decrease'],
      count < 0 && [YieldEachSecond, 'increase'],
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

### Higher-order effects

```js
const WithLog = (send, f, ...args) => {
  const effect = JSON.stringify([f.name, ...args])
  console.log(`${effect} started`)
  const end = f((value, done) => {
    if (!done)
      console.log(`${effect} sent "${value}"`)
    send(value, done)
  }, ...args)
  return () => { end(); console.log(`${effect} cancelled`) }
}
// yield [[WithLog, YieldEachSecond, 'hello']]
```

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

# Reaffect
[![npm](https://img.shields.io/npm/v/reaffect.svg)](https://www.npmjs.org/package/reaffect)
[![size](https://img.shields.io/bundlephobia/minzip/reaffect.svg)](https://bundlephobia.com)
[![deps](https://david-dm.org/rliang/reaffect/status.svg)](https://david-dm.org/rliang/reaffect)

Reaffect is a reactive effect container for Javascript apps.

It allows writing business logic as generator functions
where each yield point specifies a set of active effects,
which are then automatically started, cancelled or kept active.

This means effects are reactive.
That is, they reflect the current state of the application.

- 📚 [API](index.d.ts)
- ⚡ [Examples](example)

## Getting started

### Installation

```sh
npm i reaffect
```

### Defining effects

An effect is just a function
which takes a *dispatcher* function as the first argument,
and returns a *canceller* function.

The dispatcher function
takes a value as the first argument,
and whether the effect is finished as the second argument.

```js
function SendEachSecond(dispatch, valueToSend) {
  const id = setInterval(() => dispatch(valueToSend, false), 1000)
  return () => clearInterval(id)
}
```

In the following examples,
we can see that effects can be wrapped
into higher-order effects that process the events
they receive in some way.

```js
const WithLog = (dispatch, f, ...args) => {
  const str = JSON.stringify([f.name, ...args])
  console.log(`${str} started`)
  const cancel = f((value, done) => {
    if (!done)
      console.log(`${str} sent "${value}"`)
    dispatch(value, done)
  }, ...args)
  return () => { cancel(); console.log(`${str} cancelled`) }
}
```

```js
const WithTakeN = (dispatch, n, f, ...args) => {
  let k = 0
  return f((value, done) => dispatch(value, done || k++ < n), ...args)
}
```

```js
const WithDiscard = (dispatch, f, ...args) =>
  f((value, done) => done && dispatch(null, done), ...args)
```

### Activating effects

Activating effects and retrieving their sent values
can be done inside a generator function
or any object with a `next` method.

```js
import { reaffect } from 'reaffect'

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

In the following example,
we can see that generators are composable through `yield*`.

```js
function* screen1() { 
  while (true) {
    const msg = yield [/* ... */]
    if (msg === 'screen2')
      yield* screen2()
  }
}
```

The following example wraps a generator
into a higher-order generator
that logs all events it receives.

```js
const withLogAll = gen => ({
  next(v) {
    let { done, value } = gen.next(v)
    return { done, value: done ? undefined : value.map(e => e && [WithLog, ...e]) }
  }
})
```

## [Examples](#examples)

### React counter

```js
import React from 'react'
import { render } from 'react-dom'
import { reaffect } from 'reaffect'

const SendEachSecond = (dispatch, value) =>
  clearInterval.bind(this, setInterval(dispatch, 1000, value))

const Render = (dispatch, count) => {
  render(
    <div>
      <div>{count}</div>
      <button onClick={() => dispatch('increase')}>+1</button>
      <button onClick={() => dispatch('decrease')}>-1</button>
    </div>
  , document.getElementById('root')))
  return () => dispatch = () => {}
}

function* app() { 
  let count = 0
  while (true) {
    const msg = yield [
      [Render, count], 
      count > 0 && [SendEachSecond, 'decrease'],
      count < 0 && [SendEachSecond, 'increase'],
    ]
    switch (msg) {
      case 'increase':
        count++
        break
      case 'decrease':
        count--
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
const WrapAsyncIterator = (dispatch, f, ...args) => {
  const it = (async () => {
    for await (const v of f(...args))
      dispatch(v)
    dispatch(null, true)
  })()
  return () => it.return()
}
```

## Acknowledgements

This library is inspired by
[hyperapp](https://github.com/jorgebucaran/hyperapp/tree/V2)
and [Elm](https://elm-lang.org).

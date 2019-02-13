# Reaffect
[![npm](https://img.shields.io/npm/v/reaffect.svg)](https://www.npmjs.org/package/reaffect)
[![size](https://img.badgesize.io/rliang/reaffect/master/index.js.png?compression=gzip)](https://github.com/ngryman/badge-size)

Reaffect is a reactive side-effect container for Javascript apps.

It allows building apps where side-effects are:

* A function of the current state of the application;
* Separate from business logic;
* Written with idiomatic modern Javascript.

## [Getting started](#getting-started)

[Skip to Examples](#examples)

### Installation

```sh
npm i reaffect
```

### Creating a store

```js
import createStore from 'reaffect'
const effects = createStore()
```

### Defining an effect

An effect is uniquely identified by
a function that returns an async iterator,
and arguments for that function.
Thus, an active effect is the respective started async iterator,
which can be cancelled by calling `.return()` on it.

```js
const YieldEachSecond = value => {
  let next, id = setInterval(() => next(value), 1000)
  return {
    async next() {
      await new Promise(resolve => next = resolve)
      return { done: false, value }
    },
    return() {
      clearInterval(id)
    },
  }
}
```

This example, however, doesn't work exactly the way we expect it to.

Since iterators are *pull*-based
and callbacks (`setInterval`) are *push*-based,
values emitted between calls to `.next()` are lost.

We can fix that with a buffer.

```js
const YieldEachSecond = value => {
  let buffer = [], next, id = setInterval(() => { buffer.push(value); next() }, 1000)
  return {
    async next() {
      if (!buffer.length)
        await new Promise(resolve => next = resolve)
      return { done: false, value: buffer.shift() }
    },
    return() {
      clearInterval(id)
    },
  }
}
```

That's a lot of boilerplate for just an interval.

We can more efficiently wrap callback-based interfaces
with a library such as
[callback-to-async-iterator](https://github.com/withspectrum/callback-to-async-iterator).

```js
import asyncify from 'callback-to-async-iterator'

const YieldEachSecond = value =>
  asyncify(next => Promise.resolve(setInterval(next, 1000, value)),
    { onClose: clearInterval })
```

### Storing effects

The store `effects` is a just a function
that takes any amount of effects as arguments.

To activate an effect,
pass it as an array
where the first item is the function
and the rest are its arguments.

Then, `effects` returns a promise
to the next value yielded by any of the stored effects.

```js
const nextValue = await effects([YieldEachSecond, 'hello'])
// >>> 'hello'
```

To cancel effects,
simply call `effects()` again, but without them.

Subsequent calls to `effects()` with the same effects will not restart them.

## [Examples](#examples)

### React counter

```js
import React from 'react'
import { render } from 'react-dom'
import createStore from 'reaffect'
import asyncify from 'callback-to-async-iterator'

const YieldEachSecond = value =>
  asyncify(next => Promise.resolve(setInterval(next, 1000, value)),
    { onClose: clearInterval })

const Render = count =>
  asyncify(next => Promise.resolve(render((
    <div>
      <div>{count}</div>
      <button onClick={() => next('increase')}>+1</button>
      <button onClick={() => next('decrease')}>-1</button>
    </div>
  ), document.getElementById('root'))))

async function app(effects) {
  let count = 0
  while (true) {
    const msg = await effects(
      [Render, count], 
      count > 0 && [YieldEachSecond, 'decrease'],
    )
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

app(createStore())
```

### Higher-order effects

```js
const WithLog = (fn, ...args) => {
  const key = JSON.stringify([fn.name, ...args])
  const gen = fn(...args)
  console.log(`${key} starteed`)
  return {
    async next() {
      const { done, value } = await gen.next()
      if (!done)
        console.log(`${key} yield "${value}"`)
      return { done, value }
    },
    return() {
      console.log(`${key} cancelled`)
      return gen.return()
    },
  }
}

await effect([WithLog, YieldEachSecond, 'hello'])
```

## [Acknowledgements](#acknowledgements)

This library is inspired by
[hyperapp](https://github.com/jorgebucaran/hyperapp/tree/V2)
and [Elm](https://elm-lang.org).

## [License](#license)

MIT

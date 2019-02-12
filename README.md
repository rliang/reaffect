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

An effect is an **async generator function** and its arguments.
Thus, an active effect is the respective running async generator.
It may communicate with the exterior world
by yielding or returning values.

```js
async function* YieldEachSecond(value) {
  let id
  try {
    while (true)
      yield await new Promise(resolve => id = setTimeout(resolve, 1000, value))
  } finally {
    clearTimeout(id)
  }
}
```

Now, this has quite a bit of boilerplate for just a timeout.
That's because we had to create a sequence of Promises
wrapping `setTimeout`, which is a callback-based interface.

We can do this more efficiently with a wrapper library such as
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
where the first item is the async generator function
and the rest are its arguments.

Then, `effects` returns a promise
to the next value yielded by any of the stored effects.

```js
const nextValue = await effects([YieldEachSecond, 'hello'])
// >>> 'hello'
```

To cancel effects,
simply call `effects()` again, but without them.
This causes `.return()` to be called on their async generators.

```js
const nextValue = await effects([YieldEachSecond, 'world'])
// >>> 'world'
```

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
async function* WithLog(fn, ...args) {
  const key = JSON.stringify([fn.name, ...args])
  console.log(`${key} starting`)
  try {
    for await (const value of fn(...args)) {
      console.log(`${key}: yield "${value}"`)
      yield value
    }
  } finally {
    console.log(`${key} cancelled`)
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

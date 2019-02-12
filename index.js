module.exports = (hash=v => JSON.stringify(v, (k, v) => typeof v === 'function' ? v.toString() : v)) => {
  let states = {}
  return async (...effects) => {
    const newStates = {}
    for (const effect of effects) {
      // filter out falsy values
      if (!effect)
        continue
      const [fun, ...args] = effect, key = hash(effect)
      // get effect state from cache or initialize it
      const [gen, next] = states[key] || [fun(...args), null]
      // remove duplicate from cache if any
      delete states[key]
      // store state, ensuring it contains next promise to await
      newStates[key] = [gen, next || gen.next()]
    }
    // cancel old effects
    for (const [gen, next] of Object.values(states))
      gen.return()
    // race each effect's promise
    const [key, gen, { done, value }] =
      await Promise.race(Object.entries(states = newStates).map(async ([key, [gen, next]]) =>
        [key, gen, await next]))
    // reset the winner effect
    states[key] = [gen, null]
    // remove the effect if no more values
    if (done)
      delete states[key]
    return value
  }
}

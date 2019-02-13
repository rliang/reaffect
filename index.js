module.exports = (hash=v => JSON.stringify(v, (k, v) => typeof v === 'function' ? v.toString() : v)) => {
  let states = {}
  return function() {
    let newStates = {}
    for (let key in arguments) {
      let eff = arguments[key]
      // filter out falsy values
      if (!eff)
        continue
      key = hash(eff)
      // get effect state from cache or initialize it
      eff = states[key] || {g: eff[0](...eff.slice(1))}
      // remove duplicate from cache if any
      delete states[key]
      // store state, ensuring it contains next promise to await
      newStates[key] = {g: eff.g, p: eff.p || eff.g.next()}
    }
    // cancel old effects
    for (let key in states)
      states[key].g.return()
    // race each effect's promise
    return Promise.race(
      Object.keys(states = newStates)
        .map(k => states[k].p.then(v => ({k, v})))
    ).then(win => {
      // reset the winner effect
      delete states[win.k].p
      // remove the effect if no more values
      if (win.v.done)
        delete states[win.k]
      return win.v.value
    })
  }
}

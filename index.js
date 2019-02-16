module.exports = (gen, hash=v => JSON.stringify(v, (k, v) => typeof v === 'function' ? v.toString() : v)) => {
  let current = {}, next = value => {
    let result = gen.next(value);
    let updated = {};
    // Same behavior as `yield*`: ignore return value.
    if (!result.done) for (let effect of result.value) if (effect) {
      let key = hash(effect);
      // Transfer existing effect to `updated` if any, or initialize one
      updated[key] = current[key] || effect[0]((value, done) => {
        // In case the callback is somehow invoked after the effect is
        // cancelled.
        if (key in current) {
          // Immediately cancel effect if done, might need a restart.
          if (done) {
            current[key]();
            delete current[key];
          }
          next(value);
        }
      }, ...effect.slice(1));
      delete current[key];
    }
    // Cancel remaining effects which were not transferred to `updated`.
    for (let key in current)
      current[key]();
    current = updated;
  };
  next();
}

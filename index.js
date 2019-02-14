module.exports = (gen, hash=v => JSON.stringify(v, (k, v) => typeof v === 'function' ? v.toString() : v)) => {
  let current = {}, next = value => {
    let result = gen.next(value);
    if (!result.done) {
      let updated = {};
      for (let effect of result.value) {
        if (effect) {
          let key = hash(effect);
          updated[key] = current[key] || effect[0]((key => (value, done) => {
            if (key in current) {
              if (done) {
                current[key]();
                delete current[key];
              }
              next(value);
            }
          })(key), ...effect.slice(1));
          delete current[key];
        }
      }
      for (let key in current)
        current[key]();
      current = updated;
    }
  };
  next();
}

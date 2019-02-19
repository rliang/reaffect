// @ts-check

/**
 * @template T
 * @typedef {(value: T, done?: boolean) => void} Dispatcher
 */
/**
 * @template T
 * @typedef {[(dispatch: Dispatcher<T>, ...args: any[]) => () => void, ...any[]]} Effect
 */
/**
 * @template T
 * @typedef {{next: (value: T) => {value: (Effect<T> | false)[], done?: boolean}}} Engine
 */

/**
 * @param {any[]} a
 * @param {any[]} b
 */
let defaultIsEqual = (a, b) => {
  let n = a.length;
  if (n !== b.length)
    return false;
  for (let i = 0; i < n; i++)
    if (a[i] !== b[i])
      return false;
  return true;
};

/**
 * @template T
 * @param {Engine<T>} gen
 * @param {(a: any[], b: any[]) => boolean} isEqual
 */
module.exports.reaffect = (gen, isEqual=defaultIsEqual) => {
  /** @type {{e: Effect<T>, k: () => void, d?: boolean}[]} */
  let olds = [];
  /** @type {(v?: T) => void} */
  let next = v => {
    let r = gen.next(v), news = r.done ? [] : r.value.filter(e => e).map((/** @type {Effect<T>} */ e) => {
      // Find effect state in cache
      for (let j = 0; j < olds.length; j++) {
        if (isEqual(e, olds[j].e)) {
          // Found: But is done, should be restarted
          if (olds[j].d)
            break;
          // Found: Transfer from olds to news
          return olds.splice(j, 1)[0];
        }
      }
      // Not found, initialize effect state
      let state = {e, k: e[0]((v, done) => {
        state.d = done;
        next(v);
      }, ...e.slice(1))};
      return state;
    });
    // Cancel effects which were not transferred during the traversal
    olds.forEach(s => s.k());
    olds = news;
  };
  next();
};

// W1 action registry. Action domains self-register from public/actions/*.js.
// New buttons belong in their owner's domain file, never in app.js.
window.WealthActions = (function () {
  const handlers = new Map();
  return {
    registerDomain(names, fn) {
      // First registration wins, matching the original single-function semantics
      // where the first matching branch returned from handleAction entirely.
      names.forEach((name) => { if (!handlers.has(name)) handlers.set(name, fn); });
    },
    dispatch(ctx) {
      const fn = handlers.get(ctx.action);
      if (!fn) {
        openLanding('not-implemented', { attempted: ctx.action || '' });
        return;
      }
      fn(ctx.action, ctx.el, ctx.productId, ctx.event);
    },
    knownActions() {
      return [...handlers.keys()].sort();
    }
  };
})();

module.exports = {
  render: require('./lib/render.js').default,
  wrapRootEpic: function(f) { return f; }
};

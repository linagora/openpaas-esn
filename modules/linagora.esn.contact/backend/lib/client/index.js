module.exports = dependencies => {
  const client = require('./client');

  return function(options) {
    return client(dependencies, options);
  };
};

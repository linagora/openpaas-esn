'use strict';

module.exports = function(dependencies) {
  var client = require('./client');

  return function(options) {
    return client(dependencies, options);
  };
};

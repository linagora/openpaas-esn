'use strict';

module.exports = function(dependencies) {

  function start(callback) {
    require('./strategies/twitter')(dependencies).configure(callback);
  }

  return {
    start: start
  };
};

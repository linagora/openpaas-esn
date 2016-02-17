'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function start(callback) {
    var strategies = require('./strategies')(dependencies);
    Object.keys(strategies).forEach(function(key) {
      strategies[key].configure(function(err) {
        if (err) {
          logger.warn('OAuth consumer ' + key + ' is not configured');
        }
        callback();
      });
    });
  }

  return {
    start: start
  };
};

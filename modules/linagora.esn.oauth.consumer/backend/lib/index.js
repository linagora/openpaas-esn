'use strict';

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function start(callback) {
    require('./strategies/twitter')(dependencies).configure(function(err) {
      if (err) {
        logger.warn('OAuth consumer is not configured');
      }
      callback();
    });
  }

  return {
    start: start
  };
};

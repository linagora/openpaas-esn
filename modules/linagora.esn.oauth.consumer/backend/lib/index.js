'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function start(callback) {
    var strategies = require('./strategies')(dependencies);
    var promises = Object.keys(strategies).map(function(key) {
      var defer = q.defer();
      strategies[key].configure(function(err) {
        if (err) {
          logger.warn('OAuth consumer ' + key + ' configuration failure', err);
        }
        defer.resolve();
      });
      return defer.promise;
    });

    q.all(promises).finally(callback);
  }

  return {
    start: start
  };
};

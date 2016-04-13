'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var config = dependencies('config')('default');

  function start(callback) {
    if (config.auth && config.auth.oauth && config.auth.oauth.strategies && config.auth.oauth.strategies.length) {
      var promises = config.auth.oauth.strategies.map(function(strategy) {
        var defer = q.defer();

        try {
          require('./strategies/' + strategy)(dependencies).configure(function(err) {
            if (err) {
              logger.warn('OAuth Login %s configuration failure', strategy, err);
            }
            defer.resolve();
          });
        } catch (err) {
          logger.warn('Can not initialize %s lib oauth login strategy', strategy, err);
          defer.resolve();
        }
        return defer.promise;
      });
      q.all(promises).finally(callback);
    } else {
      callback();
    }
  }

  return {
    start: start
  };
};

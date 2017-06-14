const q = require('q');
const { OAUTH_CONFIG_KEY } = require('./constants');

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const esnConfig = dependencies('esn-config');
  const strategies = require('./strategies')(dependencies);

  function start(callback) {
    configureStrategies(callback);
    reconfigureOnChange();
  }

  function configureStrategies(callback) {
    const promises = Object.keys(strategies).map(function(key) {
      const defer = q.defer();

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

  function reconfigureOnChange() {
    const noop = () => {};

    esnConfig(OAUTH_CONFIG_KEY).onChange(() => {
      logger.info('OAuth config is changed, reconfiguring OAuth consumer providers');
      configureStrategies(noop);
    });
  }

  return {
    start: start
  };
};

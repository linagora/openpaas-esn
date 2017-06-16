const q = require('q');
const passport = require('passport');
const { OAUTH_CONFIG_KEY } = require('./constants');

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const esnConfig = dependencies('esn-config');
  const config = dependencies('config')('default');

  function start(callback) {
    configureStrategies(callback);
    reconfigureOnChange();
  }

  function configureStrategies(callback) {
    if (config.auth && config.auth.oauth && config.auth.oauth.strategies && config.auth.oauth.strategies.length) {
      const promises = config.auth.oauth.strategies.map(function(strategyName) {
        const defer = q.defer();

        try {
          const strategy = require('./strategies/' + strategyName)(dependencies);

          strategy.configure(function(err) {
            if (err) {
              if (/OAuth is not configured correctly/.test(err.message)) {
                passport.unuse(strategy.name);
              }

              logger.warn('OAuth Login %s configuration failure', strategyName, err);
            }
            defer.resolve();
          });
        } catch (err) {
          logger.warn('Can not initialize %s lib oauth login strategy', strategyName, err);
          defer.resolve();
        }

        return defer.promise;
      });

      q.all(promises).finally(callback);
    } else {
      callback();
    }
  }

  function reconfigureOnChange() {
    const noop = () => {};

    esnConfig(OAUTH_CONFIG_KEY).onChange(() => {
      logger.info('OAuth config is changed, reconfiguring OAuth login providers');
      configureStrategies(noop);
    });
  }

  return {
    start: start
  };
};

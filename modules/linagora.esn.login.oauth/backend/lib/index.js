const q = require('q');
const _ = require('lodash');

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const esnConfig = dependencies('esn-config');
  const config = dependencies('config')('default');
  const pubsub = dependencies('pubsub').global;
  const pubsubTopic = pubsub.topic(esnConfig.constants.EVENTS.CONFIG_UPDATED);

  function start(callback) {
    configureStrategies(callback);
    reconfigureOnChange();
  }

  function configureStrategies(callback) {
    if (config.auth && config.auth.oauth && config.auth.oauth.strategies && config.auth.oauth.strategies.length) {
      const promises = config.auth.oauth.strategies.map(function(strategy) {
        const defer = q.defer();

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

  function reconfigureOnChange() {
    const noop = () => {};

    pubsubTopic.subscribe(data => {
      if (isOauthConfigChanged(data)) {
        logger.info('OAuth config is changed, reconfiguring OAuth login providers');
        configureStrategies(noop);
      }
    });
  }

  function isOauthConfigChanged(data) {
    return data.moduleName === 'core' && _.find(data.configsUpdated, { name: 'oauth' });
  }

  return {
    start: start
  };
};

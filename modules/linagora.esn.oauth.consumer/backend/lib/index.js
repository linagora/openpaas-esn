const q = require('q');
const _ = require('lodash');

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const esnConfig = dependencies('esn-config');
  const pubsub = dependencies('pubsub').global;
  const strategies = require('./strategies')(dependencies);
  const pubsubTopic = pubsub.topic(esnConfig.constants.EVENTS.CONFIG_UPDATED);

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

    pubsubTopic.subscribe(data => {
      if (isOauthConfigChanged(data)) {
        logger.info('OAuth config is changed, reconfiguring OAuth consumer providers');
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

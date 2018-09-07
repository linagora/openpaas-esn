const core = require('../core');
const esnConfig = require('../core/esn-config');
const mongo = core.db.mongo;
const topic = core.pubsub.local.topic('mongodb:connectionAvailable');
const logger = core.logger;

const WEBSERVER_CONFIG_KEY = 'webserver';
const TRUST_PROXY_KEY = 'trust proxy';

module.exports = function(application) {
  if (mongo.isConnected()) {
    onMongoConnected();
  }
  topic.subscribe(onMongoConnected);
  reconfigureOnChange();

  function reconfigureOnChange() {
    esnConfig(WEBSERVER_CONFIG_KEY).onChange(() => {
      logger.info('Webserver config has changed, reconfiguring...');
      configure();
    });
  }

  function onMongoConnected() {
    logger.info('MongoDB is connected, setting up Express configuration');
    configure();
  }

  function configure() {
    esnConfig(WEBSERVER_CONFIG_KEY).get((err, config) => {
      if (err) {
        return logger.warn('Can not get webserver configuration', err);
      }

      if (!config) {
        return logger.info('ESN does not have any webserver settings');
      }

      if (!config.proxy) {
        return logger.info('ESN does not have any webserver proxy settings');
      }

      logger.info(`Setting up '${TRUST_PROXY_KEY}' to '${!!config.proxy.trust}' on Express application`);
      application.set(TRUST_PROXY_KEY, !!config.proxy.trust);
      logger.info(`Express application '${TRUST_PROXY_KEY}' is now set to ${application.get(TRUST_PROXY_KEY)}`);
    });
  }
};

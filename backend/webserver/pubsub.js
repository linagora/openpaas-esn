'use strict';

const core = require('../core');
const esnConfig = require('../core/esn-config');
const mongo = core.db.mongo;
const topic = core.pubsub.local.topic('mongodb:connectionAvailable');
const logger = core.logger;

module.exports = function(application) {
  if (mongo.isConnected()) {
    setConfiguration();
  }

  topic.subscribe(setConfiguration);

  function setConfiguration() {
    logger.info('MongoDB is connected, setting up express configuration');

    esnConfig('webserver').get(function(err, config) {
      if (err) {
        return logger.warn('Can not get webserver configuration : ' + err);
      }

      if (!config) {
        return logger.info('ESN does not have any webserver settings');
      }

      if (config && config.proxy && config.proxy.trust) {
        logger.info('Setting up trust proxy an express application');
        application.enable('trust proxy');
      }
    });
  }
};

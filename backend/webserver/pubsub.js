'use strict';

var core = require('../core'),
  mongo = core.db.mongo,
  topic = core.pubsub.local.topic('mongodb:connectionAvailable'),
  logger = core.logger;

module.exports = function(application) {
  var setConfiguration = function() {
    logger.info('MongoDB is connected, setting up express configuration');

    var esnConf = require('../core/esn-config');
    esnConf('web').get(function(err, config) {
      if (err) {
        logger.warning('Can not set express configuration : ' + err);
        return;
      }

      if (!config) {
        logger.info('ESN does not have any web settings');
        return;
      }

      if (config && config.proxy && config.proxy.trust && config.proxy.trust === true) {
        logger.info('Setting up trust proxy an express application');
        application.enable('trust proxy');
      }
    });
  };

  if (mongo.isConnected()) {
    setConfiguration();
  }
  topic.subscribe(setConfiguration);
};

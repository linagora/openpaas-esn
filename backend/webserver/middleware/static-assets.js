const logger = require('../../core').logger;
const express = require('express');
const esnConfig = require('../../core/esn-config');
const mongoAvailableTopic = require('../../core/pubsub').local.topic('mongodb:connectionAvailable');

module.exports = function staticAssets(application, url, path, mwArgs = {}) {
  let mw = express.static(path, mwArgs);

  function proxyMiddleware(...args) {
    mw(...args);
  }

  application.use(url, proxyMiddleware);

  mongoAvailableTopic.subscribe(() => {
    esnConfig('webserver').get((err, config) => {
      if (err) {
        logger.error('Unable to get web configuration, %s', err);

        return;
      }
      if (!config || !config.maxAge) {
        logger.debug('No configuration set for static assets maxAge');

        return;
      }

      logger.info('Setting static assets maxAge to %s for route %s', config.maxAge, url);
      mw = express.static(path, { ...mwArgs, maxAge: config.maxAge });
    });
  });
};

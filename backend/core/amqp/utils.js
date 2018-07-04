const url = require('url');
const logger = require('../../core/logger');
const CONSTANTS = require('./constants');

module.exports = {
  buildUrlFromEnvOrDefaults,
  dataAsBuffer,
  getUrl
};

function buildUrlFromEnvOrDefaults() {
  if (process.env.AMQP_CONNECTION_URI) {
    return process.env.AMQP_CONNECTION_URI;
  }

  const username = process.env.AMQP_USERNAME || CONSTANTS.DEFAULT_AMQP_USERNAME;
  const password = process.env.AMQP_PASSWORD || CONSTANTS.DEFAULT_AMQP_PASSWORD;

  return url.format({
    protocol: process.env.AMQP_PROTOCOL || CONSTANTS.DEFAULT_AMQP_PROTOCOL,
    slashes: true,
    hostname: process.env.AMQP_HOST || CONSTANTS.DEFAULT_AMQP_HOST,
    auth: username + ':' + password,
    port: process.env.AMQP_PORT || CONSTANTS.DEFAULT_AMQP_PORT
  });
}

function dataAsBuffer(data) {
  return Buffer.from(JSON.stringify(data), CONSTANTS.PUBSUB_EXCHANGE.encoding);
}

function getUrl() {
  return require('../../core/esn-config')('amqp').get()
    .then(config => {
      if (config && config.url) {
        return config.url;
      }

      logger.debug('No AMQP connection URL found in ESN configuration. Falling back to environment variables or default.');

      return buildUrlFromEnvOrDefaults();
    });
}

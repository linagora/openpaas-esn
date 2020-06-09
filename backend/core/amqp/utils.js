const url = require('url');
const logger = require('../../core/logger');
const CONSTANTS = require('./constants');

module.exports = {
  buildUrlFromEnvOrDefaults,
  dataAsBuffer,
  getUrl,
  getRabbitMQUrl
};

function buildUrlFromEnvOrDefaults() {
  if (process.env.AMQP_CONNECTION_URI) {
    return process.env.AMQP_CONNECTION_URI;
  }

  const protocol = process.env.AMQP_PROTOCOL || CONSTANTS.DEFAULT_AMQP_PROTOCOL;
  const hostName = process.env.AMQP_HOST || CONSTANTS.DEFAULT_AMQP_HOST;
  const port = process.env.AMQP_PORT || CONSTANTS.DEFAULT_AMQP_PORT;

  return buildUrl(protocol, hostName, port);
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

function getRabbitMQUrl() {
  return require('../../core/esn-config')('amqp').get()
    .then(config => {
      if (config && config.http_url) {
        return config.http_url;
      }

      logger.debug('No AMQP http connection URL found in ESN configuration. Falling back to environment variables or default.');

      const protocol = process.env.AMQP_HTTP_PROTOCOL || CONSTANTS.DEFAULT_AMQP_HTTP_PROTOCOL;
      const hostName = process.env.AMQP_HTTP_HOST || CONSTANTS.DEFAULT_AMQP_HTTP_HOST;
      const port = process.env.AMQP_HTTP_PORT || CONSTANTS.DEFAULT_AMQP_HTTP_PORT;
      return buildUrl(protocol, hostName, port);
    });
}

function buildUrl(protocol, hostName, port) {
  const username = process.env.AMQP_USERNAME || CONSTANTS.DEFAULT_AMQP_USERNAME;
  const password = process.env.AMQP_PASSWORD || CONSTANTS.DEFAULT_AMQP_PASSWORD;

  return url.format({
    protocol: protocol,
    slashes: true,
    hostname: hostName,
    auth: username + ':' + password,
    port: port
  });
}

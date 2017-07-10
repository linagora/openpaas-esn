'use strict';

const logger = require('../../core/logger');
const AmqpClient = require('./client');
const url = require('url');
let clientInstancePromise;

function connect(options = {}) {
  const url = getURL(options);

  logger.info('Creating a connection to the amqp server with the url: ', url);

  return require('amqplib').connect(url);
}

function createClient() {
  return require('../../core/esn-config')('amqp').get()
    .then(connect)
    .then(conn => conn.createChannel())
    .then(channel => new AmqpClient(channel))
    .catch(err => {
      logger.error('Unable to create the AMQP client: ', err);
      throw err;
    });
}

function getClient() {
  clientInstancePromise = clientInstancePromise || createClient();

  return clientInstancePromise;
}

function getHost() {
  return process.env.AMQP_HOST || 'localhost';
}

function getPort() {
  return process.env.AMQP_PORT || '5672';
}

function getURL(options) {
  if (options && options.url) {
    return options.url;
  }

  const connectionUrl = {
    protocol: 'amqp',
    slashes: true,
    hostname: getHost(),
    port: getPort()
  };

  return url.format(connectionUrl);
}

module.exports = {
  getClient
};

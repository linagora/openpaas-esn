'use strict';

const logger = require('../../core/logger');
const AmqpClient = require('./client');
const url = require('url');
const Q = require('q');
let clientInstancePromise;

function connect(options = {}) {
  const url = getURL(options);

  logger.info('Creating a connection to the amqp server with the url: ', url);

  return require('amqp-connection-manager').connect([url]);
}

function createClient(onConnect, onDisconnect, onClient) {
  return require('../../core/esn-config')('amqp').get()
    .then(connect)
    .then(connection => bindEvents(connection, onConnect, onDisconnect))
    .then(connection => connection.createChannel({
      name: 'globalPubsub',
      setup: channel => {
        const client = new AmqpClient(channel);

        onClient(client);

        return Q.when(client);
      }
    }))
    .catch(err => {
      logger.error('Unable to create the AMQP client: ', err);
      throw err;
    });
}

function bindEvents(connection, onConnect, onDisconnect) {
  connection.on('connect', onConnect);
  connection.on('disconnect', onDisconnect);

  return connection;
}

function getClient(onConnect, onDisconnect, onClient) {
  clientInstancePromise = clientInstancePromise || createClient(onConnect, onDisconnect, onClient);

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
    port: getPort(),
    heartbeat: 3
  };

  return url.format(connectionUrl);
}

module.exports = {
  getClient
};

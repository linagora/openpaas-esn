'use strict';

const q = require('q');
const logger = require('../../core/logger');
const amqpEsnConfig = require('../../core/esn-config')('amqp');
const AmqpClient = require('./client');

function connect(options) {
  logger.info('Trying to open a connection to the amqp server with the url: ', options.url);

  return require('amqplib').connect(options.url);
}

function createClient() {
  return amqpEsnConfig.get()
    .then(connect)
    .then(conn => conn.createChannel())
    .then(channel => new AmqpClient(channel));
}

let clientInstancePromise;
function getClient() {
  clientInstancePromise = clientInstancePromise || createClient();

  return clientInstancePromise;
}

module.exports = {
  getClient
};

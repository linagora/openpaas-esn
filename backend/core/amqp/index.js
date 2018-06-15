const Q = require('q');
const logger = require('../../core/logger');
const amqpUtils = require('./utils');
const AmqpClient = require('./client');
const localPubsub = require('../../core/pubsub/local');
const amqpConnectionManager = require('amqp-connection-manager');

const amqpConnectedTopic = localPubsub.topic('amqp:connected');
const amqpDisconnectedTopic = localPubsub.topic('amqp:disconnected');
const amqpClientTopic = localPubsub.topic('amqp:client:available');

let connected = false;
let connManPromise;
let clientInstancePromiseResolve;
let clientInstancePromise;

function createClient() {
  return amqpUtils.getUrl()
    .then(connect)
    .then(bindEvents)
    .then(onConnection)
    .catch(err => {
      logger.error('Unable to create the AMQP connection: ', err);
    });
}

function getClient() {
  if (!connManPromise) {
    connManPromise = createClient();
  }

  if (!clientInstancePromise) {
    clientInstancePromise = Q.Promise(resolve => {
      clientInstancePromiseResolve = resolve;
    });
  }

  return clientInstancePromise;
}

function connect(connectionUrl) {
  logger.info('Creating a connection to the amqp server with the url: ', connectionUrl);

  return amqpConnectionManager.connect([connectionUrl]);
}

function bindEvents(connection) {
  connection.on('connect', connection => {
    connected = true;
    logger.info('AMQP: broadcasting connected event');
    amqpConnectedTopic.publish(connection);
  });

  // disconnect is called when going from "connected" to "disconnected",
  // and also at every unsuccessfull connection attempt
  connection.on('disconnect', err => {
    logDisconnectError(err);

    if (connected) {
      clientInstancePromise = Q.Promise(resolve => {
        clientInstancePromiseResolve = resolve;
      });
    }
    connected = false;

    logger.info('AMQP: broadcasting disconnected event');
    amqpDisconnectedTopic.publish(err);
  });

  return connection;
}

function onConnection(connection) {
  connection.createChannel({
    name: 'AMQP default ESN channel',
    setup: channel => {
      const client = new AmqpClient(channel);

      clientInstancePromiseResolve(client);
      logger.info('AMQP: broadcasting client:available event');
      amqpClientTopic.publish(client);
    }
  });
}

function logDisconnectError(e) {
  const error = e.err ? e.err : e;
  const errorCode = error.code ? error.code : error;

  logger.warn('RabbitMQ connection lost', errorCode);
  logger.debug(error);
}

module.exports = {
  getClient
};

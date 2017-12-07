'use strict';

const logger = require('../../').logger;
const RabbitPubsub = require('./rabbit');
const localPubsub = require('../').local;
const rabbitPubsub = new RabbitPubsub('global');
const amqpClientProvider = require('../../amqp');

function onConnect() {}

function onDisconnect(e) {
  const error = e.err ? e.err : e;
  const errorCode = error.code ? error.code : error;

  logger.warn('RabbitMQ connection lost', errorCode);
  logger.debug(error);
  rabbitPubsub.unsetClient();
}

function onClient(client) {
  rabbitPubsub.setClient(client);
}

localPubsub.topic('mongodb:connectionAvailable').subscribe(function() {
  amqpClientProvider
    .getClient(onConnect, onDisconnect, onClient)
    .catch(e => logger.error('Globalpubsub (RabbitMQ) Severe error', e));
});

module.exports = rabbitPubsub;

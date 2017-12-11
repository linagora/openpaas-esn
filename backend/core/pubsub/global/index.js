'use strict';

const logger = require('../../').logger;
const RabbitPubsub = require('./rabbit');
const localPubsub = require('../').local;
const rabbitPubsub = new RabbitPubsub('global');
const amqpClientProvider = require('../../amqp');
const amqpDisconnectedTopic = localPubsub.topic('amqp:disconnected');
const amqpClientTopic = localPubsub.topic('amqp:client:available');

amqpDisconnectedTopic.subscribe(() => {
  rabbitPubsub.unsetClient();
});

amqpClientTopic.subscribe(client => {
  rabbitPubsub.setClient(client);
});

localPubsub.topic('mongodb:connectionAvailable').subscribe(function() {
  amqpClientProvider
    .getClient()
    .catch(e => logger.error('Globalpubsub (RabbitMQ) Severe error', e));
});

module.exports = rabbitPubsub;

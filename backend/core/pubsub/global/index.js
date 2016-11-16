'use strict';

const Pubsub = require('../pubsub');
const localPubsub = require('../').local;
const rabbitPubsub = new Pubsub('global');
const amqpClientProvider = require('../../amqp');

localPubsub.topic('mongodb:connectionAvailable').subscribe(function() {
  amqpClientProvider
    .getClient()
    .then(client => rabbitPubsub.setClient(client));
});

module.exports = rabbitPubsub;

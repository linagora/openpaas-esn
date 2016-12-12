'use strict';

const Pubsub = require('../pubsub');
const rabbitPubsub = new Pubsub('global');

require('../../amqp')
  .getClient()
  .then(client => rabbitPubsub.setClient(client));

module.exports = rabbitPubsub;

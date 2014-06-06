'use strict';

var Pubsub = require('../pubsub');
var redisPubsub = new Pubsub();
var localPubsub = require('../').local;
var AwesomeNodeRedisPubsub = require('awesome-node-redis-pubsub');

module.exports = redisPubsub;

localPubsub.topic('redis:configurationAvailable').subscribe(function(config) {
  var client = new AwesomeNodeRedisPubsub(config);
  redisPubsub.setClient(client);
});

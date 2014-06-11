'use strict';

var Pubsub = require('../pubsub');
var redisPubsub = new Pubsub();
var localPubsub = require('../').local;
var AwesomeNodeRedisPubsub = require('awesome-node-redis-pubsub');
var logger = require('../../logger');

module.exports = redisPubsub;

localPubsub.topic('redis:configurationAvailable').subscribe(function(config) {
  config.onRedisError = function(err) {
    logger.error('Got an error on redis pubsub : ' + err);
  };
  var client = new AwesomeNodeRedisPubsub(config);
  redisPubsub.setClient(client);
});

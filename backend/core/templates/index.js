'use strict';

var core = require('..'),
    mongo = core.db.mongo,
    pubsub = core.pubsub.local,
    logger = require('../logger');

var user = require('./user');
module.exports.user = user;

function injectTemplates() {
  user.store(function(err) {
    if (err) {
      logger.error('user template cannot be injected into database', err.message);
    }
  });
}


module.exports.inject = function(callback) {
  if (mongo.isConnected()) {
    injectTemplates();
    return callback();
  }

  var topic = pubsub.topic('mongodb:connectionAvailable');
  function subscriber() {
    injectTemplates();
    topic.unsubscribe(subscriber);
  }
  topic.subscribe(subscriber);
  return callback();
};

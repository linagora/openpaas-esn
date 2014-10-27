'use strict';

var core = require('..'),
    mongo = core.db.mongo,
    pubsub = core.pubsub.local;

var user = require('./user');
module.exports.user = user;

function injectTemplates() {
  user.store(function(err) {
    if (err) {
      console.log('user template cannot be injected into database', err);
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

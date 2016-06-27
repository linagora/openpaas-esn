'use strict';

var denormalizer = require('./denormalizer');
var pubsub = require('../pubsub').local;
var logger = require('../logger');
var as = require('../activitystreams');
var q = require('q');

function registerUserStreamHandlers(topic, handlers) {

  function buildHandler(handler) {
    return function handle(data) {
      handler(data).then(function(entry) {
        as.addTimelineEntry(entry, function(err, result) {
          if (err) {
            return logger.error('Error while saving TimelineEntry', err);
          }
          logger.debug('TimelineEntry has been saved', result);
        });
      }, function(err) {
        return logger.error('Error while creating TimelineEntry from data', err);
      });
    };
  }

  handlers.forEach(function(handler) {
    pubsub.topic(topic).subscribe(buildHandler(handler));
  });
}
module.exports.registerUserStreamHandlers = registerUserStreamHandlers;

function init() {
  var messageLike = require('./listeners/message.like');
  registerUserStreamHandlers(messageLike.LIKE_NOTIFICATION, [messageLike.handler]);

  var userFollow = require('./listeners/user.follow');
  registerUserStreamHandlers(userFollow.FOLLOW_NOTIFICATION, [userFollow.handler]);

  denormalizer.init();
}
module.exports.init = init;

module.exports.denormalizer = denormalizer;

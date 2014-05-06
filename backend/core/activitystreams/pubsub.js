'use strict';

var pubsub = require('../pubsub').local;
var logger = require('../logger');
var activitystream = require('./index');
var helpers = require('./helpers');
var userModule = require('../user');
var initialized = false;

function saveMessageAsActivityEvent(data) {
  if (!data) {
    logger.warn('Can not save null data');
    return;
  }

  var source = data.source;
  var targets = data.targets;
  var message = data.message;
  var date = data.date || Date.now;
  var verb = data.verb;

  if (!message || !source || !source.resource || !targets || targets.length === 0 || !verb) {
    logger.error('Can not save message with null attributes', data);
    return;
  }

  if (!source.type || source.type !== 'user') {
    logger.error('Can not handle non user message');
    return;
  }

  var addEntry = function(user, callback) {
    var entry = helpers.userMessageToTimelineEntry(message, verb, user, targets, date);
    activitystream.addTimelineEntry(entry, callback);
  };

  userModule.get(source.resource, function(err, user) {
    if (err) {
      logger.error('Error while getting user: ' + source.resource, err);
      return;
    }

    if (!user) {
      logger.error('Can not find user ' + source.resource);
      return;
    }

    addEntry(user, function(err, saved) {
      if (err) {
        logger.warn('Error while adding timeline entry : ', + err.message);
      } else {
        if (saved) {
          logger.debug('Message has been saved to the timeline : ' + saved._id);
        }
      }
    });
  });
}
module.exports.saveMessageAsActivityEvent = saveMessageAsActivityEvent;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  pubsub.topic('message:activity').subscribe(saveMessageAsActivityEvent);
  initialized = true;
}
module.exports.init = init;

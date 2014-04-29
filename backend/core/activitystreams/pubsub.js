'use strict';

var pubsub = require('../pubsub').local;
var logger = require('../logger');
var activitystream = require('./index');
var helpers = require('./helpers');
var initialized = false;

function saveMessageAsActivityEvent(data) {
  if (!data) {
    logger.warn('Can not save null data');
    return;
  }

  var message = data.message;
  var user = data.user;

  if (!message || !user) {
    logger.error('Can not handle a null message or user');
    return;
  }

  var entry = helpers.userMessageToTimelineEntry(message, user);
  activitystream.addTimelineEntry(entry, function(err, saved) {
    if (err) {
      logger.warn('Error while adding timeline entry : ', + err.message);
    } else {
      if (saved) {
        logger.debug('Message has been saved to the timeline : ' + saved._id);
      }
    }
  });
}
module.exports.saveMessageAsActivityEvent = saveMessageAsActivityEvent;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  pubsub.topic('timeline:message:created').subscribe(saveMessageAsActivityEvent);
  initialized = true;
}
module.exports.init = init;

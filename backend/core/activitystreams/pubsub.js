'use strict';

var async = require('async');
var pubsub = require('../pubsub').local;
var logger = require('../logger');
var activitystream = require('./index');
var helpers = require('./helpers');
var messageModule = require('../message');
var userModule = require('../user');
var initialized = false;

function saveMessageAsActivityEvent(data) {
  if (!data) {
    logger.warn('Can not save null data');
    return;
  }

  var from = data.from;
  var targets = data.targets;
  var messageId = data.message;

  if (!messageId || !from || !from.resource || !targets || targets.length === 0) {
    logger.error('Can not save message with null attributes', data);
    return;
  }

  if (!from.type || from.type !== 'user') {
    logger.error('Can not handle non user message');
    return;
  }

  var getUser = function(callback) {
    userModule.get(from.resource, callback);
  };

  var getMessage = function(callback) {
    messageModule.get(messageId, callback);
  };

  var addEntry = function(user, message, callback) {
    var entry = helpers.userMessageToTimelineEntry(message, 'post', user, targets);
    activitystream.addTimelineEntry(entry, callback);
  };

  async.parallel({user: getUser, message: getMessage}, function(err, results) {
    if (err) {
      logger.error('Can not save message', err);
      return;
    }

    if (!results.user || !results.message) {
      logger.error('Null user of message', results);
      return;
    }

    addEntry(results.user, results.message, function(err, saved) {
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
  pubsub.topic('message:posted').subscribe(saveMessageAsActivityEvent);
  initialized = true;
}
module.exports.init = init;

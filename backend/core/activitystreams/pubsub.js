'use strict';

var pubsub = require('../pubsub').local;
var logger = require('../logger');
var activitystream = require('./index');
var initialized = false;

function createActivity(data, callback) {
  if (!data) {
    logger.warn('Can not create activity from null data');
    return;
  }

  callback = callback || function(err, saved) {
    if (err) {
      logger.warn('Error while adding timeline entry : ', + err.message);
    } else {
      if (saved) {
        logger.debug('Activity has been saved into the timeline : ' + saved._id);
      }
    }
  };
  activitystream.addTimelineEntry(data, callback);
}
module.exports.createActivity = createActivity;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  pubsub.topic('message:activity').subscribe(createActivity);
  initialized = true;
}
module.exports.init = init;

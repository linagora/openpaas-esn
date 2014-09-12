'use strict';

var pubsub = require('../pubsub').local;
var logger = require('../logger');
var activitystream = require('./index');
var tracker = require('./tracker');
var Community = require('mongoose').model('Community');
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

function updateTimelineEntriesTracker(data, callback) {
  if (!data) {
    logger.warn('Can not create timeline entries tracker from null data');
    return;
  }

  callback = callback || function(err, saved) {
    if (err) {
      logger.warn('Error while adding timeline entry tracker : ', + err.message);
    } else {
      if (saved) {
        logger.debug('Timeline entries tracker has been created / updated into database : ' + saved._id);
      }
    }
  };

  Community.findOne({_id: data.community}, function(err, community) {
    if (err) {
      return callback(err);
    }

    var options = {
      target: {
        objectType: 'activitystream',
        _id: community.activity_stream.uuid
      },
      limit: 1
    };
    activitystream.query(options, function(err, results) {
      if (err) {
        return callback(err);
      }
      if (! results || results.length === 0) {
        return callback(null, null);
      }

      tracker.updateLastTimelineEntryRead(data.target, community.activity_stream.uuid, results[0]._id, function(err, saved) {
        if (err) {
          return callback(err);
        }
        return callback(null, saved);
      });
    });
  });
}

module.exports.updateTimelineEntriesTracker = updateTimelineEntriesTracker;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  pubsub.topic('message:activity').subscribe(createActivity);
  pubsub.topic('community:join').subscribe(updateTimelineEntriesTracker);
  initialized = true;
}
module.exports.init = init;

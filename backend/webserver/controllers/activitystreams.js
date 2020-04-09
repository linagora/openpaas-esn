'use strict';

var activitystreams = require('../../core/activitystreams');
const logger = require('../../core/logger');
var tracker = require('../../core/activitystreams/tracker').getTracker('read');
var mongoose = require('mongoose');
var escapeStringRegexp = require('escape-string-regexp');
var async = require('async');

var isLimitvalid = function(limit) {
  return limit > 0;
};

var isValidObjectId = function(id) {
  try {
    new mongoose.Types.ObjectId(id);
    return true;
  } catch (err) {
    return false;
  }
};

/*
 * Check if the tracker can be updated :
 *  * req.user is mandatory
 *  * req.query.before must not be set because the tracker must be updated only when a user GET all the timelines entries
 *  or if the req.query.after is defined
 *  * if timelineEntriesReadable[0] is defined then there is at least 1 timeline entry in the activity stream
 */
function updateTracker(req, timelineEntriesReadable) {
  if (req && req.user && !req.query.before && timelineEntriesReadable && timelineEntriesReadable[0]) {
    // When req.query.after, the last timeline entry is the last element in the result array
    if (req.query.after && timelineEntriesReadable[timelineEntriesReadable.length - 1]) {
      tracker.updateLastTimelineEntry(req.user._id, req.activity_stream._id, timelineEntriesReadable[timelineEntriesReadable.length - 1]._id, function() {});
    } else {
      tracker.updateLastTimelineEntry(req.user._id, req.activity_stream._id, timelineEntriesReadable[0]._id, function() {});
    }
  }
}

function getMine(req, res) {
  function streamsCallback(err, streams) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server error', details: err.message}});
    }
    return res.status(200).json(streams || []);
  }

  if (!req.user) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'User missing'}});
  }

  var options = {};
  if (req.query && req.query.domainid) {
    options.domainid = req.query.domainid;
  }

  if (req.query && req.query.writable) {
    options.writable = req.query.writable;
  }

  if (req.query && req.query.name) {
    var escapedString = escapeStringRegexp(req.query.name);
    options.name = new RegExp(escapedString, 'i');
  }

  if (req.query && req.query.member && req.query.member === 'true') {
    options.member = true;
  }

  return activitystreams.getUserStreams(req.user, options, streamsCallback);
}
module.exports.getMine = getMine;

function get(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  var options = {
    target: activity_stream
  };

  if (req.query.limit) {
    if (!isLimitvalid(req.query.limit)) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Limit parameter must be strictly positive'}});
    }
    options.limit = req.query.limit;
  }

  if (req.query.before) {
    if (!isValidObjectId(req.query.before)) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: '"before" parameter must be a valid ObjectId.'}});
    }
    options.before = req.query.before;
  }

  if (req.query.after) {
    if (!isValidObjectId(req.query.after)) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: '"after" parameter must be a valid ObjectId.'}});
    }
    options.after = req.query.after;
  }

  activitystreams.query(options, function(err, timelineEntriesFound) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Internal error', details: 'Can not get Activity Stream for resource ' + activity_stream}});
    }

    async.filter(timelineEntriesFound, function(timelineEntry, callback) {
      activitystreams.permission.canRead(timelineEntry, {objectType: 'user', id: req.user._id}, callback);
    }, function(err, timelineEntriesReadable) {
      if (err) {
        const details = `Failed to get activity stream ${req.params.uuid}`;

        logger.error(details, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details
          }
        });
      }

      res.json(timelineEntriesReadable);
      updateTracker(req, timelineEntriesReadable);
    });
  });
}
module.exports.get = get;

function getUnreadCount(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  tracker.countSinceLastTimelineEntry(req.user._id, req.activity_stream._id, function(err, count) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Internal error',
        details: 'Fail to get the number of unread timeline entries for this activity stream ( ' +
          req.activity_stream._id + '): ' + err.message}});
    }
    return res.status(200).json({
      _id: req.activity_stream._id,
      unread_count: count
    });
  });
}
module.exports.getUnreadCount = getUnreadCount;

function getResource(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  if (!activity_stream.target) {
    return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Could not find a resource for this stream.'}});
  }

  return res.status(200).json(activity_stream.target);
}
module.exports.getResource = getResource;

function updateTimelineEntryVerb(verb) {
  return (req, res) => {
    const activitystream = { uuid: req.activity_stream._id, objectType: 'activitystream' };

    activitystreams.updateTimelineEntryVerbFromStreamMessage(activitystream, req.message, verb, err => {
      if (err) {
        logger.error('Can not update the timeline entry', err);

        return res.status(500).json({ error: {code: 500, message: 'Server error', details: `Can not update the timeline entry verb to ${verb}`}});
      }

      res.status(204).send();
    });
  };
}
module.exports.updateTimelineEntryVerb = updateTimelineEntryVerb;

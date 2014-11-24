'use strict';

var activitystreams = require('../../core/activitystreams');
var tracker = require('../../core/activitystreams/tracker');
var mongoose = require('mongoose');
var escapeStringRegexp = require('escape-string-regexp');

var isLimitvalid = function(limit) {
  return limit > 0;
};

var isValidObjectId = function(id) {
  try {
    new mongoose.Types.ObjectId(id);
    return true;
  }
  catch (err) {
    return false;
  }
};

function getMine(req, res) {
  function streamsCallback(err, streams) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
    }
    return res.json(200, streams || []);
  }

  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User missing'}});
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

  return activitystreams.getUserStreams(req.user, options, streamsCallback);
}
module.exports.getMine = getMine;

function get(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  var options = {
    target: activity_stream
  };

  if (req.query.limit) {
    if (!isLimitvalid(req.query.limit)) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Limit parameter must be strictly positive'}});
    }
    options.limit = req.query.limit;
  }

  if (req.query.before) {
    if (!isValidObjectId(req.query.before)) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: '"before" parameter must be a valid ObjectId.'}});
    }
    options.before = req.query.before;
  }

  if (req.query.after) {
    if (!isValidObjectId(req.query.after)) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: '"after" parameter must be a valid ObjectId.'}});
    }
    options.after = req.query.after;
  }

  activitystreams.query(options, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Internal error', details: 'Can not get Activity Stream for resource ' + activity_stream}});
    }

    res.json(result);

    /*
     * Check if the tracker can be update :
     *  * req.user is mandatory
     *  * req.query.before must not be set because the tracker must be update only when a user GET all the timelines entries
     *  or if the req.query.after is defined
     *  * if result[0] is defined then there is at least 1 timeline entry in the activity stream
     */
    if (req.user && !req.query.before && result[0]) {
      // When req.query.after, the last timeline entry is the last element in the result array
      if (req.query.after && result[result.length - 1]) {
        tracker.updateLastTimelineEntryRead(req.user._id, activity_stream._id, result[result.length - 1]._id, function(err) {});
      } else {
        tracker.updateLastTimelineEntryRead(req.user._id, activity_stream._id, result[0]._id, function(err) {});
      }
    }
  });
}
module.exports.get = get;

function getUnreadCount(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  tracker.getUnreadTimelineEntriesCount(req.user._id, req.activity_stream._id, function(err, count) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Internal error',
        details: 'Fail to get the number of unread timeline entries for this activity stream ( ' +
          req.activity_stream._id + '): ' + err.message}});
    }
    return res.json(200, {
      _id: req.activity_stream._id,
      unread_count: count
    });
  });
}
module.exports.getUnreadCount = getUnreadCount;

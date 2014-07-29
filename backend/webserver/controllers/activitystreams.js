'use strict';

var activitystreams = require('../../core/activitystreams');
var mongoose = require('mongoose');

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
  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User missing'}});
  }

  activitystreams.getUserStreams(req.user, function(err, streams) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server error', details: err.message}});
    }
    return res.json(200, streams || []);
  });
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
    return res.json(result);
  });
}
module.exports.get = get;

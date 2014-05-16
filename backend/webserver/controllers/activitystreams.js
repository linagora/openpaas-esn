'use strict';

var activitystreams = require('../../core/activitystreams');
var mongoose = require('mongoose');

var isLimitvalid = function(limit) {
  return limit > 0;
};

var isBeforeValid = function(before) {
  try {
    new mongoose.Types.ObjectId(before);
    return true;
  }
  catch (err) {
    return false;
  }
};

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
    if (!isBeforeValid(req.query.before)) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Before parameter must be a valid Date.'}});
    }
    options.before = req.query.before;
  }

  activitystreams.query(options, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Internal error', details: 'Can not get Activity Stream for resource ' + activity_stream}});
    }
    return res.json(result);
  });
}
module.exports.get = get;

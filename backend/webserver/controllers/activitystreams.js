'use strict';

var activitystreams = require('../../core/activitystreams');

function get(req, res) {
  var activity_stream = req.activity_stream;

  if (!activity_stream) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Activity Stream is missing'}});
  }

  var options = {
    target: activity_stream
  };

  if (req.query.limit) {
    options.limit = req.query.limit;
  }

  if (req.query.before) {
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

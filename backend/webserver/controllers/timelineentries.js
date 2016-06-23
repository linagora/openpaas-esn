'use strict';

var activitystreamModule = require('../../core/activitystreams');
var logger = require('../../core/logger');

var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;

function list(req, res) {

  var userTuple = {objectType: 'user', _id: req.user._id};

  var options = {
    limit: req.query.limit || DEFAULT_LIMIT,
    offset: req.query.offset || DEFAULT_OFFSET,
    actor: userTuple,
    target: userTuple
  };

  if (req.query.verb) {
    options.verb = req.query.verb;
  }

  activitystreamModule.getTimelineEntries(options, function(err, result) {
    if (err) {
      logger.error('Error while getting timelineentries', options, err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    }

    res.header('X-ESN-Items-Count', result.total_count);
    return res.status(200).json(result.list || []);
  });
}
module.exports.list = list;

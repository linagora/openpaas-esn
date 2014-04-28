'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var activitystreams = require('../../core/activitystreams');

/**
 * Get an activity stream from its uuid
 */
function get(req, res) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameters', details: 'ActivityStream ID is missing'}});
  }

  // get the domain from the activity_stream id
  Domain.getOneFromActivityStream(uuid, function(err, domain) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Internal error', details: 'Can not load domain from activitystream uuid ' + uuid}});
    }

    if (!domain) {
      return res.json(404, {error: {code: 404, message: 'Resource Not Found', details: 'Can not find domain from activitystream uuid ' + uuid}});
    }

    var options = {
      target: {
        objectType: 'domain',
        _id: domain._id
      }
    };

    if (req.query.limit) {
      options.limit = req.query.limit;
    }

    if (req.query.before) {
      options.before = req.query.before;
    }

    activitystreams.query(options, function(err, result) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Internal error', details: 'Can not get activitystream for domain ' + domain._id}});
      }
      return res.json(result);
    });
  });
}
module.exports.get = get;

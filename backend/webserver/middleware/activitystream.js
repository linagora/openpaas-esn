'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');
var Community = mongoose.model('Community');

module.exports.findStreamResource = function(req, res, next) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameter', details: 'Stream UUID is required'}});
  }

  Domain.getFromActivityStreamID(uuid, function(err, domain) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while searching the stream resource : ' + err.message}});
    }

    if (!domain) {
      Community.getFromActivityStreamID(uuid, function(err, community) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while searching the stream resource : ' + err.message}});
        }

        if (!community) {
          return res.json(404, {error: {code: 404, message: 'Not Found', details: 'Can not find a valid resource for the stream : ' + uuid}});
        }

        req.activity_stream = {
          objectType: 'activitystream',
          _id: uuid
        };
        next();
      });
    }
    else {
      req.activity_stream = {
        objectType: 'activitystream',
        _id: uuid
      };
      next();
    }
  });

};

module.exports.filterValidTargets = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    return next();
  }

  var targets = req.body.targets;
  if (!targets || targets.length === 0) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Message targets are required'}});
  }

  var async = require('async');
  async.filter(targets,
    function(item, callback) {
      Domain.getFromActivityStreamID(item.id, function(err, domain) {
        if (!err && !domain) {
          return Community.getFromActivityStreamID(item.id, function(err, community) {
            return callback(!err && community);
          });
        }
        return callback(!err && domain);
      });
    },
    function(results) {
      if (!results || results.length === 0) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Invalid message targets'}});
      }
      req.body.targets = results;
      next();
    }
  );
};

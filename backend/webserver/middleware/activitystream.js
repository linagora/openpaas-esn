'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var activitystreams = require('../../core/activitystreams');
var communityPermission = require('../../core/community/permission');

module.exports.findStreamResource = function(req, res, next) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameter', details: 'Stream UUID is required'}});
  }

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
};

module.exports.filterWritableTargets = function(req, res, next) {
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
      Community.getFromActivityStreamID(item.id, function(err, community) {

        if (err || !community) {
          return callback(false);
        }

        communityPermission.canWrite(community, req.user, function(err, writable) {
          return callback(!err && writable);
        });
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

module.exports.isValidStream = function(req, res, next) {
  var objectType = req.query.objectType ||  req.query.objectType;
  if (!objectType) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'objectType is mandatory'}});
  }

  var id = req.query.id;
  if (!id) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'ID is mandatory'}});
  }

  activitystreams.getUserStreams(req.user, function(err, streams) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Bad request', details: err.message}});
    }

    if (!streams) {
      return res.json(400, { error: { status: 400, message: 'Bad request', details: 'User does not have any linked activitystream'}});
    }

    var belongs = streams.some(function(stream) {
      return stream.uuid === id;
    });

    if (belongs) {
      return next();
    }
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'User does not have access to the ativitystream ' + id}});
  });
};

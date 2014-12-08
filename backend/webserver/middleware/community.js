'use strict';

var communityModule = require('../../core/community');
var communityPermission = require('../../core/community/permission');
var mongoose = require('mongoose');
var Community = mongoose.model('Community');

module.exports.findStreamResource = function(req, res, next) {
  var uuid = req.params.uuid;

  Community.getFromActivityStreamID(uuid, function(err, community) {
    if (err) {
      return next(new Error('Error while searching the stream resource : ' + err.message));
    }

    if (!community) {
      return next();
    }

    req.activity_stream = {
      objectType: 'activitystream',
      _id: uuid,
      target: community
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
        return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You can not create message'}});
      }
      req.body.targets = results;
      next();
    }
  );
};

module.exports.canJoin = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User_id is missing'}});
  }

  if (req.community.type !== 'open') {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Can not join community'});
  }

  return next();
};

module.exports.canLeave = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User_id is missing'}});
  }

  if (req.user._id.equals(req.community.creator)) {
    return res.json(403, {error: 403, message: 'Forbidden', details: 'Creator can not leave community'});
  }

  return next();
};

function requiresCommunityMember(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  communityModule.isMember(req.community, req.user._id, function(err, isMember) {
    if (err) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (!isMember) {
      return res.json(403, {error: 403, message: 'Forbidden', details: 'User is not community member'});
    }
    return next();
  });
}

module.exports.requiresCommunityMember = requiresCommunityMember;

module.exports.checkUserParamIsNotMember = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  communityModule.isMember(req.community, req.param('user_id'), function(err, isMember) {
    if (err) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'Can not define the community membership : ' + err.message});
    }

    if (isMember) {
      return res.json(400, {error: 400, message: 'Bad request', details: 'User is already member of the community.'});
    }
    return next();
  });
};

module.exports.isCreator = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.user._id.equals(req.community.creator)) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Not the community creator'});
  }

  return next();
};

module.exports.checkUserIdParameterIsCurrentUser = function(req, res, next) {
  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (!req.param('user_id')) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user id'});
  }

  if (!req.user._id.equals(req.param('user_id'))) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Parameters do not match'});
  }
  return next();
};

module.exports.ifNotCommunityManagerCheckUserIdParameterIsCurrentUser = function(req, res, next) {
  if (req.isCommunityManager) {
    return next();
  }

  module.exports.checkUserIdParameterIsCurrentUser(req, res, next);
};

module.exports.canRead = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  if (req.community.type === 'open' || req.community.type === 'restricted') {
    return next();
  }
  return requiresCommunityMember(req, res, next);
};

module.exports.flagCommunityManager = function(req, res, next) {
  if (!req.community) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing community'});
  }

  if (!req.user) {
    return res.json(400, {error: 400, message: 'Bad request', details: 'Missing user'});
  }

  communityModule.isManager(req.community, req.user, function(err, manager) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Error when checking if the user is a manager', details: err.message}});
    }
    req.isCommunityManager = manager;
    next();
  });
};

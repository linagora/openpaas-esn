const communityModule = require('../../core/community');
const communityPermission = communityModule.permission;
const mongoose = require('mongoose');
const Community = mongoose.model('Community');

module.exports = {
  findStreamResource,
  filterWritableTargets
};

function findStreamResource(req, res, next) {
  const uuid = req.params.uuid;

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
      target: {
        objectType: 'community',
        object: community
      }
    };
    next();
  });
}

function filterWritableTargets(req, res, next) {
  const inReplyTo = req.body.inReplyTo;

  if (inReplyTo) {
    return next();
  }

  const targets = req.body.targets;

  if (!targets || targets.length === 0) {
    return next();
  }

  const async = require('async');

  async.filter(targets,
    function(item, callback) {
      Community.getFromActivityStreamID(item.id, function(err, community) {

        if (err || !community) {
          return callback(err, false);
        }

        communityPermission.canWrite(community, { objectType: 'user', id: req.user.id }, callback);
      });
    },
    function(err, results) {
      if (!results || results.length === 0) {
        return next();
      }

      if (!req.message_targets) {
        req.message_targets = [];
      }

      req.message_targets = req.message_targets.concat(results);
      next();
    }
  );
}

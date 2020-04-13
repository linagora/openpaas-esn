const async = require('async');
const SimulatedCollaboration = require('mongoose').model('SimulatedCollaboration');
const collaborationPermission = require('../../../../backend/core/collaboration/permission');
const { OBJECT_TYPE } = require('../constants');
const {
  addStreamResourceFinder,
  addStreamWritableFinder
} = require('../../../../backend/webserver/middleware/activitystream');

module.exports = {
  registerActivityStreamMW
};

function registerActivityStreamMW() {
  addStreamResourceFinder(findStreamResource);
  addStreamWritableFinder(filterWritableTargets);
}

function findStreamResource(req, res, next) {
  const uuid = req.params.uuid;

  SimulatedCollaboration.getFromActivityStreamID(uuid, function(err, collaboration) {
    if (err) {
      return next(new Error('Error while searching the stream resource : ' + err.message));
    }

    if (!collaboration) {
      return next();
    }

    req.activity_stream = {
      objectType: 'activitystream',
      _id: uuid,
      target: {
        objectType: OBJECT_TYPE,
        object: collaboration
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

  async.filter(targets,
    function(item, callback) {
      SimulatedCollaboration.getFromActivityStreamID(item.id, function(err, collaboration) {

        if (err || !collaboration) {
          return callback(err, false);
        }

        collaborationPermission.canWrite(collaboration, { objectType: 'user', id: req.user.id }, callback);
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

'use strict';

module.exports = function(lib, deps) {

  var findStreamResource = function(req, res, next) {
    var uuid = req.params.uuid;

    lib.getFromActivityStreamID(uuid, function(err, project) {
      if (err) {
        return next(new Error('Error while searching the stream resource : ' + err.message));
      }

      if (!project) {
        return next();
      }

      req.activity_stream = {
        objectType: 'activitystream',
        _id: uuid,
        target: project
      };
      next();
    });
  };

  var findWritableResource = function(req, res, next) {
    var permission = deps('collaboration').permission;

    var inReplyTo = req.body.inReplyTo;
    if (inReplyTo) {
      return next();
    }

    var targets = req.body.targets;
    if (!targets || targets.length === 0) {
      return next();
    }

    var async = require('async');
    async.filter(targets,
      function(item, callback) {
        lib.getFromActivityStreamID(item.id, function(err, project) {

          if (err || !project) {
            return callback(false);
          }

          permission.canWrite(project, {objectType: 'user', id: req.user._id + ''}, function(err, writable) {
            return callback(!err && writable);
          });
        });
      },
      function(results) {
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
  };

  deps('activitystreamMW').addStreamResourceFinder(findStreamResource);
  deps('activitystreamMW').addStreamWritableFinder(findWritableResource);

  return {
    findStreamResource: findStreamResource,
    findWritableResource: findWritableResource
  };
};

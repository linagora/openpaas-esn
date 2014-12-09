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

  deps('activitystreamMW').addStreamResourceFinder(findStreamResource);

  return {
    findStreamResource: findStreamResource
  };
};

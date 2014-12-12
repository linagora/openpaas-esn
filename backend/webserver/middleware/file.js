'use strict';

var fileModule = require('../../core/filestore');

module.exports.loadMeta = function(req, res, next) {
  var id = req.params.id;

  fileModule.getMeta(id, function(err, meta) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Error while getting file', details: err.message}});
    }

    if (!meta) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'File not found'}});
    }

    if (!meta.metadata) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not find file metadata'}});
    }

    req.fileMeta = meta;
    return next();
  });
};

module.exports.isOwner = function(req, res, next) {
  var meta = req.fileMeta;

  if (meta.metadata.creator && meta.metadata.creator.objectType === 'user' && !meta.metadata.creator.id.equals(req.user._id)) {
    return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'Current user is not a file owner'}});
  }

  return next();
};

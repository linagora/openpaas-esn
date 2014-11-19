'use strict';

var uuid = require('node-uuid');
var filestore = require('../../core/filestore');

function create(req, res) {
  var size = parseInt(req.query.size, 10);
  if (isNaN(size) || size < 1) {
    return res.json(400, {
      error: 400,
      message: 'Bad Parameter',
      details: 'size parameter should be a positive integer'
    });
  }

  var fileId = uuid.v1();
  var metadata = {};
  if (req.query.name) {
    metadata.name = req.query.name;
  }

  if (req.user) {
    metadata.creator = {objectType: 'user', id: req.user._id};
  }

  filestore.store(fileId, req.query.mimetype, metadata, req, {}, function(err, file) {
    if (err) {
      return res.json(500, {
        error: 500,
        message: 'Server error',
        details: err.message || err
      });
    }

    if (file.length !== size) {
      return filestore.delete(fileId, function(err) {
        res.json(412, {
          error: 412,
          message: 'File size mismatch',
          details: 'File size given by user agent is ' + size +
                   ' and file size returned by storage system is ' +
                   file.length
        });
      });
    }

    return res.json(201, { _id: fileId });
  });
}

function get(req, res) {
  if (!req.params.id) {
    return res.json(400, {
      error: 400,
      message: 'Bad Request',
      details: 'Missing id parameter'
    });
  }

  filestore.get(req.params.id, function(err, fileMeta, readStream) {
    if (err) {
      return res.json(503, {
        error: 503,
        message: 'Server error',
        details: err.message || err
      });
    }

    if (!readStream) {
      return res.json(404, {
        error: 404,
        message: 'Not Found',
        details: 'Could not find file'
      });
    }

    if (fileMeta) {
      var modSince = req.get('If-Modified-Since');
      var clientMod = new Date(modSince);
      var serverMod = fileMeta.uploadDate;
      clientMod.setMilliseconds(0);
      serverMod.setMilliseconds(0);

      if (modSince && clientMod.getTime() === serverMod.getTime()) {
        return res.send(304);
      } else {
        res.set('Last-Modified', fileMeta.uploadDate);
      }

      res.type(fileMeta.contentType);

      if (fileMeta.metadata.name) {
        res.set('Content-Disposition', 'inline; filename="' +
                fileMeta.metadata.name.replace(/"/g, '') + '"');
      }
    }

    res.status(200);
    return readStream.pipe(res);
  });
}

function remove(req, res) {
  if (!req.params.id) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Missing id parameter'}});
  }
  var meta = req.fileMeta;

  if (meta.metadata.referenced) {
    return res.json(409, {error: {code: 409, message: 'Conflict', details: 'File is used and can not be deleted'}});
  }

  filestore.delete(req.params.id, function(err) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message || err}});
    }
    return res.send(204);
  });
}

module.exports = {
  create: create,
  get: get,
  remove: remove
};

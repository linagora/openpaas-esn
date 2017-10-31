'use strict';

var filestore = require('../../core/filestore');
var Busboy = require('busboy');
var ObjectId = require('mongoose').Types.ObjectId;

function create(req, res) {
  var size = parseInt(req.query.size, 10);
  if (isNaN(size) || size < 1) {
    return res.status(400).json({
      error: 400,
      message: 'Bad Parameter',
      details: 'size parameter should be a positive integer'
    });
  }

  var fileId = new ObjectId();
  var options = {};
  var metadata = {};
  if (req.query.name) {
    options.filename = req.query.name;
  }

  if (req.user) {
    metadata.creator = {objectType: 'user', id: req.user._id};
  }

  var saveStream = function(stream) {
    var interrupted = false;
    req.on('close', function() {
      interrupted = true;
    });

    return filestore.store(fileId, req.query.mimetype, metadata, stream, options, function(err, saved) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server error',
            details: err.message || err
          }
        });
      }

      if (saved.length !== size || interrupted) {
        return filestore.delete(fileId, function() {
          res.status(412).json({
            error: {
              code: 412,
              message: 'File size mismatch',
              details: 'File size given by user agent is ' + size +
              ' and file size returned by storage system is ' +
              saved.length
            }
          });
        });
      }
      return res.status(201).json({_id: fileId});
    });
  };

  if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') === 0) {
    var nb = 0;
    var busboy = new Busboy({ headers: req.headers });
    busboy.once('file', function(fieldname, file) {
      nb++;
      return saveStream(file);
    });

    busboy.on('finish', function() {
      if (nb === 0) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'The form data must contain an attachment'
          }
        });
      }
    });
    req.pipe(busboy);

  } else {
    return saveStream(req);
  }
}

function get(req, res) {
  if (!req.params.id) {
    return res.status(400).json({
      error: 400,
      message: 'Bad Request',
      details: 'Missing id parameter'
    });
  }

  filestore.get(req.params.id, function(err, fileMeta, readStream) {
    if (err) {
      return res.status(503).json({
        error: 503,
        message: 'Server error',
        details: err.message || err
      });
    }

    if (!readStream) {
      if (req.accepts('html')) {
        res.status(404).end();
        return res.render('commons/404', { url: req.url });
      } else {
        return res.status(404).json({
          error: 404,
          message: 'Not Found',
          details: 'Could not find file'
        });
      }
    }

    if (fileMeta) {
      var modSince = req.get('If-Modified-Since');
      var clientMod = new Date(modSince);
      var serverMod = fileMeta.uploadDate;
      clientMod.setMilliseconds(0);
      serverMod.setMilliseconds(0);

      try {
        if (modSince && clientMod.getTime() === serverMod.getTime()) {
          return res.status(304).end();
        } else {
          res.set('Last-Modified', fileMeta.uploadDate);
        }

        res.type(fileMeta.contentType);

        if (fileMeta.filename) {
          res.set('Content-Disposition', 'inline; filename="' +
          fileMeta.filename.replace(/[^!#$%&'*+\-.^_`|~\d\w]/g, '') + '"');
        }

        if (fileMeta.length) {
          res.set('Content-Length', fileMeta.length);
        }
      } catch (error) {
        return res.status(500).json({
          error: 500,
          message: 'Server error',
          details: error.message || error
        });
      }
    }

    res.status(200);
    return readStream.pipe(res);
  });
}

function remove(req, res) {
  if (!req.params.id) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Missing id parameter'}});
  }
  var meta = req.fileMeta;

  if (meta.metadata.referenced) {
    return res.status(409).json({error: {code: 409, message: 'Conflict', details: 'File is used and can not be deleted'}});
  }

  filestore.delete(req.params.id, function(err) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message || err}});
    }
    return res.status(204).end();
  });
}

module.exports = {
  create: create,
  get: get,
  remove: remove
};

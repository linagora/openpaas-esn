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

  filestore.store(fileId, req.query.mimetype, metadata, req, function(err, file) {
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

module.exports = {
  create: create
};

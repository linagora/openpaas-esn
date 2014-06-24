'use strict';
var filestore = require('../../core').filestore;

function store(req, res) {
  if (!req.headers['content-type']) {
    return res.send(400, {error: {code: 400, message: 'missing header', details: 'The Content-Type header is missing'}});
  }
  var ct = req.headers['content-type'],
      id = req.params.id;
  filestore.store(id, ct, {}, req, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'File storage error', details: err}});
    }
    return res.json(result);
  });
}
module.exports.store = store;

function get(req, res) {
  filestore.get(req.params.id, function(err, meta, stream) {
    if (!err && !meta && !stream) {
      return res.json(404, {error: {code: 404, message: 'File not found', details: 'File with ID ' + req.params.id + ' not found'}});
    }
    if (err) {
      return res.json(500, {error: {code: 500, message: 'File store get failed', details: err}});
    }
    res.setHeader('Content-Type', meta.contentType);
    return stream.pipe(res);
  });
}
module.exports.get = get;

function del(req, res) {
  filestore.delete(req.params.id, function(err, response) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'File store delete failed', details: err}});
    } else if (!response) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'File ' + req.params.id + ' was not found'}});
    }
    return res.json({id: req.params.id, deleted: true});
  });
}
module.exports.del = del;

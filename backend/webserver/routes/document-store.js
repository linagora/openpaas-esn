'use strict';

var path = require('path');
var fs = require('fs');
var mongodb = require('../../core/db/mongodb');

exports = module.exports = function(application) {

  var root = path.resolve(__dirname + '/../../..');
  var config = require('../../core').config('default');
  var settings = root + '/config/db.json';

  if (config.core && config.core.config && config.core.config.db) {
    settings = path.resolve(root + '/' + config.core.config.db);
  }

  application.put('/api/document-store/connection', function(req, res) {

    var data = req.body;
    if (!data.hostname || !data.port || !data.dbname) {
      return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'hostname, port and dbname are required'}});
    }

    var hostname = data.hostname;
    var port = data.port;
    var dbname = data.dbname;

    if (hostname.length === 0) {
      return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'hostname is invalid (length == 0)'}});
    }

    if (dbname.length === 0) {
      return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'dbname is invalid (length == 0)'}});
    }

    if (port !== parseInt(port)) {
      return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'port is not a number'}});
    }

    var p = parseInt(port);
    if (p <= 0) {
      return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'port must be greater than 0'}});
    }

    fs.writeFile(settings, JSON.stringify(data), function(err) {
      if (err) {
        return res.json(500, { error: { status: 500, message: 'Server Error', details: 'Can not write database settings for ' + req.params.name}});
      }
      res.json(201, config);
    });
  });

  application.get('/api/document-store/connection/:hostname/:port/:dbname', function(req, res) {
    var hostname = req.params.hostname;
    var port = req.params.port;
    var dbname = req.params.dbname;

    mongodb.checkConnection(hostname, port, dbname, function(err) {
      if (err) {
        res.json(503, { error: { code: 503, message: 'Connection error', details: err.message}});
      } else {
        res.json(200);
      }
    });
  });
};


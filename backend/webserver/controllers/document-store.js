'use strict';

var path = require('path');
var fs = require('fs');
var mongodb = require('../../core/db/mongodb');
var root = path.resolve(__dirname + '/../../..');
var config = require('../../core').config('default');
var settings = root + '/config/db.json';

if (config.core && config.core.config && config.core.config.db) {
  settings = path.resolve(root + '/' + config.core.config.db);
}

/**
 * Store the document store configuration values
 *
 * @param {Request} req
 * @param {Response} res
 * @return {json|*|json|json|json|json}
 */
function store(req, res) {
  var data = req.body;
  if (!data.hostname || !data.port || !data.dbname) {
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'hostname, port and dbname are required'}});
  }

  if ((data.username && !data.password) || (!data.username && data.password)) {
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'username and password should both be set or both left empty'}});
  }

  var port = data.port;

  if (port !== parseInt(port)) {
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'port is not a number'}});
  }

  var p = parseInt(port);
  if (p <= 0) {
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'port must be greater than 0'}});
  }

  fs.writeFile(settings, JSON.stringify(data), function(err) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server Error', details: 'Can not write database settings in ' + settings}});
    }
    res.json(201, config);
  });
}
module.exports.store = store;

/**
 * Test the connection to the document store
 *
 * @param {Request} req
 * @param {Response} res
 */
function test(req, res) {
  var hostname = req.params.hostname;
  var port = req.params.port;
  var dbname = req.params.dbname;
  var username = null;
  var password = null;
  if (req.body && req.body.username && req.body.password) {
    username = req.body.username;
    password = req.body.password;
  }
  mongodb.validateConnection(hostname, port, dbname, username, password, function(err) {
    if (err) {
      res.json(503, { error: { code: 503, message: 'Connection error', details: err.message}});
    } else {
      res.json(200);
    }
  });
}
module.exports.test = test;


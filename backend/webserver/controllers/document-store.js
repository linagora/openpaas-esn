'use strict';

var core = require('../../core');
var mongodb = core.db.mongo;

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
    return res.status(400).json({ error: { status: 400, message: 'Bad Request', details: 'hostname, port and dbname are required'}});
  }

  if ((data.username && !data.password) || (!data.username && data.password)) {
    return res.status(400).json({ error: { status: 400, message: 'Bad Request', details: 'username and password should both be set or both left empty'}});
  }

  var port = data.port;

  if (port !== parseInt(port, 10)) {
    return res.status(400).json({ error: { status: 400, message: 'Bad Request', details: 'port is not a number'}});
  }

  var p = parseInt(port, 10);

  if (p <= 0) {
    return res.status(400).json({ error: { status: 400, message: 'Bad Request', details: 'port must be greater than 0'}});
  }

  data.connectionOptions = mongodb.getDefaultOptions();
  mongodb.storeConfiguration(data, function(err, mongoConfig) {
    if (err) {
      return res.status(500).json({ error: { status: 500, message: 'Server Error', details: err.message}});
    }
    res.status(201).json(mongoConfig);
    mongodb.init();
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
      res.status(503).json({ error: { code: 503, message: 'Connection error', details: err.message}});
    } else {
      res.status(200);
    }
  });
}
module.exports.test = test;

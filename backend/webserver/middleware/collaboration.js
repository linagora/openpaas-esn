'use strict';

var collaborationModule = require('../../core/collaboration');

function loadLib(req, res, next) {
  if (!req.params.objectType) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'objectType is required'}});
  }

  var lib = collaborationModule.getLib(req.params.objectType);
  if (!lib) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Invalid objectType'}});
  }

  req.lib = lib;
  next();
}
module.exports.loadLib = loadLib;

function load(req, res, next) {

}
module.exports.load = load;

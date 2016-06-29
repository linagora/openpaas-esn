'use strict';

var fs = require('fs');
var q = require('q');
var utils = require('./utils');
var handlers = {};

function register(verb, handler) {
  handlers[verb] = handler;
}
module.exports.register = register;

function denormalize(entry, options) {
  options = options || {};

  var e = utils.asObject(entry);
  if (handlers[e.verb]) {
    return handlers[e.verb](e, options);
  }
  return q(e);
}
module.exports.denormalize = denormalize;

function init() {
  fs.readdirSync(__dirname + '/denormalizers').forEach(function(filename) {
    var stat = fs.statSync(__dirname + '/denormalizers/' + filename);
    if (!stat.isFile()) { return; }
    var denormalizer = require('./denormalizers/' + filename)();
    register(denormalizer.verb, denormalizer.handler);
  });
}
module.exports.init = init;

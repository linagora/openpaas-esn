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

  entry = utils.asObject(entry);
  if (handlers[entry.verb]) {
    return handlers[entry.verb](entry, options);
  }
  return q(entry);
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

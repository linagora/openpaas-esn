'use strict';

var q = require('q');
var _ = require('lodash');

var roleHandlers = {};
var MODES = {
  READ: 'r',
  WRITE: 'w'
};

function addHandler(name, handler) {
  if (name && handler) {
    roleHandlers[name] = handler;
  }
}
module.exports.addHandler = addHandler;

function canReadMessage(message, user, options) {
  options = options || {};

  var promises = _.values(roleHandlers).map(function(handler) {
    return handler(MODES.READ, user, message, options);
  });

  if (!promises.length) {
    return q(true);
  }

  return q.all(promises).then(function(results) {
    return results.every(function(result) {
      return result;
    });
  });
}
module.exports.canReadMessage = canReadMessage;

'use strict';

var _ = require('lodash');
var q = require('q');
var pubsub = require('../pubsub').local;
var logger = require('../logger');
var TOPIC = require('./constants').EVENTS.userDisabled;

var handlers = {};

function processUser(type, user) {

  var promises = _.values(handlers).map(function(handler) {
    return handler[type] ? handler[type](user) : q(user);
  });

  return q.allSettled(promises).then(function(result) {
    logger.info('%s result', type, result);
    return result;
  });
}

function handleEvent(event) {
  var user = event.user;
  if (!user) {
    logger.error('No user defined in %s event', TOPIC);
    return q.reject(new Error('User is not defined'));
  }

  if (event.disabled) {
    logger.info('User %s has been disabled', user._id);
    return processUser('onUserDisabled', user);
  } else {
    logger.info('User %s has been enabled', user._id);
    return processUser('onUserEnabled', user);
  }
}
module.exports.handleEvent = handleEvent;

function init() {
  pubsub.topic(TOPIC).subscribe(handleEvent);
}
module.exports.init = init;

function registerHandler(name, handler) {
  if (name && handler) {
    handlers[name] = handler;
  }
}
module.exports.registerHandler = registerHandler;

function getHandler(name) {
  return handlers[name];
}
module.exports.getHandler = getHandler;

function getHandlers() {
  return handlers;
}
module.exports.getHandlers = getHandlers;

function removeHandler(name) {
  delete handlers[name];
}
module.exports.removeHandler = removeHandler;

'use strict';

var Task = require('./task');
var q = require('q');

var DEFAULT_DELAY = 10 * 1000;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var token = dependencies('auth').token;
  var registry = require('./registry')(dependencies);

  function cancel(id) {
    return registry.get(id).then(function(task) {
      task.cancel();
    });
  }

  function create(fn, delay, context, onComplete, onCancel) {
    logger.debug('Creating a task delayed by %s', delay);

    delay = delay || DEFAULT_DELAY;
    var options = context || {};
    options.ttl = delay;

    var _getNewToken = q.denodeify(token.getNewToken);
    return _getNewToken(options).then(function(t) {

      var token = t.token;

      function onTaskComplete(err, result) {
        registry.remove(token).then(function() {
          onComplete(err, result);
        });
      }

      function onTaskCancel() {
        registry.remove(token).then(onCancel);
      }

      try {
        var task = new Task(token, fn, delay, context, onTaskComplete, onTaskCancel);
        return registry.put(token, task);
      } catch (err) {
        return q.reject(err);
      }
    });
  }

  return {
    create: create,
    cancel: cancel,
    registry: registry
  };
};

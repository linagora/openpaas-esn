'use strict';

var Task = require('./task');

module.exports = function(dependencies) {

  var logger = dependencies('logger');

  function create(fn, delay, context, onComplete, onCancel) {
    logger.debug('Creating a task delayed by %s', delay);
    return new Task(fn, delay, context, onComplete, onCancel);
  }

  return {
    create: create
  };
};

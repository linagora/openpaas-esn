'use strict';

var q = require('q');

function Task(id, job, delay, context, onComplete, onCancel) {
  var self = this;

  if (!job) {
    throw new Error('job is required');
  }

  if (!delay) {
    throw new Error('delay is required');
  }

  if (delay < 0) {
    throw new Error('delay must be > 0');
  }

  self.id = id;
  self.job = job;
  self.delay = delay;
  self.context = context || {};
  self.onCancel = onCancel || function() {};
  self.onComplete = onComplete || function() {};

  self.defer = q.defer();
  self.defer.promise.timeout(self.delay).then(function() {
    self.onCancel();
  }, function() {
    self.job(function(err, result) {
      self.onComplete(err, result);
    });
  });
  return this;
}

Task.prototype.cancel = function() {
  this.defer.resolve();
};

Task.prototype.flush = function() {
  this.defer.reject();
};

module.exports = Task;

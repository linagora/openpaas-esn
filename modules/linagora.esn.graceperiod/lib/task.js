'use strict';

var q = require('q');

function Task(job, delay, context, onComplete, onCancel) {
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

  self.job = job;
  self.delay = delay;
  self.context = context || {};
  self.onCancel = onCancel || function() {};
  self.onComplete = onComplete || function() {};

  self.defer = q.defer();
  self.defer.promise.timeout(self.delay).then(function() {
    self.onCancel();
  }, function() {
    self.job(self.context, self.onComplete);
  });
  return this;
}

Task.prototype.cancel = function() {
  this.defer.resolve();
};

module.exports = Task;

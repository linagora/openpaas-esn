'use strict';

var Job = require('./db/job');

module.exports.getById = function(id, callback) {
  return Job.find({jobId: id}, callback);
};

module.exports.save = function(data, callback) {
  var job = data instanceof Job ? data : new Job(data);
  job.save(callback);
};

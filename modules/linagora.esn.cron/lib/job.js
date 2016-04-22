'use strict';

var Job = require('./db/job');

module.exports.getById = function(id, callback) {
  return Job.find({jobId: id}, callback);
};

module.exports.getByExactContext = function(context, callback) {
  return Job.find().where('context').equals(context).exec(callback);
};

module.exports.getAllBySubContext = function(context, callback) {
  var filter = {};
  Object.keys(context).forEach(function(key) {
    filter['context.' + key] = context[key];
  });
  return Job.find(filter).exec(callback);
};

module.exports.save = function(data, callback) {
  var job = data instanceof Job ? data : new Job(data);
  job.save(callback);
};

module.exports.remove = function(id, callback) {
  Job.remove({jobId: id}, callback);
};

module.exports.getAll = function(callback) {
  Job.find(callback);
};

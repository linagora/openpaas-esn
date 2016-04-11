'use strict';

var extend = require('extend');
var jobModule = require('./job');
var registry = {};

module.exports = function() {

  function save(job, callback) {
    jobModule.save(job, function(err, savedJob) {
      if (err) {
        return callback(err);
      }
      registry[savedJob.jobId] = savedJob;
      registry[savedJob.jobId].job = job;

      return callback(null, savedJob);
    });
  }

  function store(jobId, description, job, context, callback) {
    if (!jobId || !description || !job) {
      return callback(new Error('id, description and job are required'));
    }

    var meta = {
      jobId: jobId,
      description: description,
      context: context
    };

    save(meta, callback);
  }

  function get(id, callback) {
    if (!id) {
      return callback();
    }
    if (registry[id]) {
      return callback(null, registry[id]);
    }
    jobModule.getById(id, callback);
  }

  function update(job, callback) {
    if (!job) {
      return callback(new Error('Job is required'));
    }

    get(job.jobId, function(err, foundJob) {
      if (!foundJob) {
        return callback(new Error('Job not found'));
      }
      foundJob.state = job.state || foundJob.state;
      foundJob.timestamps.updatedAt = new Date();

      save(foundJob, callback);
    });
  }

  function remove(id, callback) {
    if (!id) {
      return callback();
    }
    delete registry[id];
    jobModule.remove(id, callback);
  }

  return {
    store: store,
    get: get,
    update: update,
    remove: remove
  };
};

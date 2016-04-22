'use strict';

var jobModule = require('./job');
var registry = {};

module.exports = function() {

  function _save(meta, cronjob, callback) {
    jobModule.save(meta, function(err, savedJob) {
      if (err) {
        return callback(err);
      }
      registry[savedJob.jobId] = savedJob;
      registry[savedJob.jobId].cronjob = cronjob;

      return callback(null, savedJob);
    });
  }

  function store(jobId, description, cronjob, context, callback) {
    if (!jobId || !description || !cronjob) {
      return callback(new Error('id, description and cronjob are required'));
    }

    var meta = {
      jobId: jobId,
      description: description,
      context: context
    };

    _save(meta, cronjob, callback);
  }

  function getInMemory(id) {
    return registry[id];
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

  function getByExactContext(context, callback) {
    if (!context) {
      return callback();
    }
    jobModule.getByExactContext(context, callback);
  }

  function getAllBySubContext(context, callback) {
    if (!context) {
      return callback();
    }
    jobModule.getAllBySubContext(context, callback);
  }

  function getAll(callback) {
    jobModule.getAll(callback);
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

      _save(foundJob, foundJob.cronJob, callback);
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
    getInMemory: getInMemory,
    getByExactContext: getByExactContext,
    getAllBySubContext: getAllBySubContext,
    getAll: getAll,
    update: update,
    remove: remove
  };
};

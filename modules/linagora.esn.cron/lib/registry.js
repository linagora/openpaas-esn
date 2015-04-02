'use strict';

var registry = {};

module.exports = function() {

  function store(id, description, job, callback) {
    if (!id || !description || !job) {
      return callback(new Error('id, description and job are required'));
    }

    var meta = {
      id: id,
      description: description,
      job: job,
      createdAt: new Date(),
      calls: 0
    };
    registry[id] = meta;
    return callback(null, meta);
  }

  function get(id, callback) {
    return callback(null, registry[id]);
  }

  function update(job, callback) {
    if (!job) {
      return callback(new Error('Job is required'));
    }

    if (!registry[job.id]) {
      return callback(new Error('Job not found'));
    }

    registry[job.id].state = job.state || registry[job.id].state;
    registry[job.id].updatedAt = job.updatedAt || registry[job.id].updatedAt;

    return callback(null, registry[job.id]);
  }

  return {
    store: store,
    get: get,
    update: update
  };
};

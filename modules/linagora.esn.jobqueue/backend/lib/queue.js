'use strict';

var kue = require('kue');
var q = require('q');

module.exports = function(dependencies) {
  var logger = dependencies('logger');
  var jobs = kue.createQueue();
  var workers = require('./workers')(dependencies);

  function createJobByName(name) {
    var defer = q.defer();
    var job = jobs.create(name, {
      title: name
    });

    job.save(function(err) {
      if (!err) {
        logger.info('Creating job ' + name + ' with id: ', job.id);
        defer.resolve(job);
      } else {
        defer.reject(err);
      }
    });
    return defer.promise;
  }

  function startJob(name, data) {
    var defer = q.defer();
    var worker = workers.get(name);
    if (!worker) {
      return q.reject(new Error('Can not find worker for this job: ' + name));
    }

    createJobByName(name).then(function() {
      jobs.process(name, function(job, done) {
        worker.getWorkerFunction()(data).then(function() {
          done();
          defer.resolve(job);
        });
      }, defer.reject);
    }, defer.reject);

    return defer.promise;
  }

  function getJobById(id) {
    var defer = q.defer();
    kue.Job.get(id, function(err, job) {
      if (!err) {
        defer.resolve(job);
      } else {
        defer.reject(err);
      }
    });
    return defer.promise;
  }

  return {
    kue: kue,
    workers: workers,
    startJob: startJob,
    getJobById: getJobById
  };
};

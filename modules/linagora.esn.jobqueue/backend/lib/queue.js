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

  function submitJob(workerName, jobName, data) {
    if (!jobName) {
      return q.reject(new Error('Cannot submit a job without jobName'));
    }
    var worker = workers.get(workerName);
    if (!worker) {
      return q.reject(new Error('Can not find worker for this job: ' + workerName));
    }
    var defer = q.defer();
    createJobByName(jobName).then(function() {
      jobs.process(jobName, function(job, done) {
        worker.getWorkerFunction()(data).then(function() {
          done();
          defer.resolve(job);
        }, function(err) {
          logger.error('Error while running job', err);
          done(new Error('Error while running job'));
          defer.reject(err);
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
    submitJob: submitJob,
    getJobById: getJobById
  };
};

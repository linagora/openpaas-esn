'use strict';

var kue = require('kue');
var q = require('q');

module.exports = function(dependencies) {
  var logger = dependencies('logger');
  var workers = require('./workers')(dependencies);
  var pubsub = dependencies('pubsub').local;
  var jobs;

  function initJobQueue() {
    var defer = q.defer();
    if (!jobs) {
      pubsub.topic('redis:configurationAvailable').subscribe(function(config) {
        jobs = kue.createQueue({redis: config});
        defer.resolve(jobs);
      });
    } else {
      defer.resolve(jobs);
    }
    return defer.promise;
  }

  function createJobByName(name) {
    var defer = q.defer();
    initJobQueue().then(function(jobs) {
      var job = jobs.create(name, {
        title: name
      });

      job.save(function(err) {
        if (!err) {
          logger.info('Creating job ' + name + ' with id: ', job.id);
          defer.resolve(jobs);
        } else {
          defer.reject(err);
        }
      });
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
    createJobByName(jobName).then(function(jobs) {
      jobs.process(jobName, function(job, done) {
        worker.getWorkerFunction()(data).then(function() {
          done();
          defer.resolve(job);
          logger.info('Job %s is complete', jobName);
        }, function(err) {
          logger.error('Error while running job', err);
          done(new Error('Error while running job'));
          defer.reject(err);
        }, function(progress) {
          if (progress) {
            job.log(progress.message);
            job.progress(progress.value, 100);
          }
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
    initJobQueue: initJobQueue,
    workers: workers,
    submitJob: submitJob,
    getJobById: getJobById
  };
};

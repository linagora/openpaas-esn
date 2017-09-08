'use strict';

const kue = require('kue');
const Q = require('q');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const workers = require('./workers')(dependencies);
  const pubsub = dependencies('pubsub').local;
  let jobQueue;

  return {
    getJobById,
    initJobQueue,
    kue,
    submitJob,
    workers
  };

  function initJobQueue() {
    const defer = Q.defer();

    if (!jobQueue) {
      pubsub.topic('redis:configurationAvailable').subscribe(config => {
        jobQueue = kue.createQueue({redis: config});
        defer.resolve(jobQueue);
      });
    } else {
      defer.resolve(jobQueue);
    }

    return defer.promise;
  }

  function createJobByName(name) {
    const defer = Q.defer();

    initJobQueue().then(jobQueue => {
      const job = jobQueue.create(name, {
        title: name
      });

      job.save(err => {
        if (!err) {
          logger.info(`Creating job ${name} with id ${job.id}`);
          defer.resolve(jobQueue);
        } else {
          defer.reject(err);
        }
      });
    });

    return defer.promise;
  }

  function submitJob(workerName, jobName, data) {
    if (!jobName) {
      return Q.reject(new Error('Cannot submit a job without jobName'));
    }
    const worker = workers.get(workerName);

    if (!worker) {
      return Q.reject(new Error(`Can not find worker for this job ${workerName}`));
    }

    const defer = Q.defer();

    createJobByName(jobName).then(jobQueue => {
      jobQueue.process(jobName, (job, done) => {
        worker.getWorkerFunction()(data).then(() => {
          done();
          defer.resolve(job);
          logger.info(`Job ${jobName} is complete`);
        }, err => {
          const error = new Error(`Error while running job: ${err.message}`);

          logger.error('Error while running job', err);
          done(error);
          defer.reject(error);
        }, progress => {
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
    const defer = Q.defer();

    kue.Job.get(id, (err, job) => {
      if (!err) {
        defer.resolve(job);
      } else {
        defer.reject(err);
      }
    });

    return defer.promise;
  }
};

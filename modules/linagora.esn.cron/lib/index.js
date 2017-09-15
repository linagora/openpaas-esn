'use strict';

var cron = require('cron');
var JOB_STATES = require('./constants').JOB_STATES;
var EVENTS = require('./constants').EVENTS;
var uuidV4 = require('uuid/v4');
var async = require('async');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub');
  var registry = require('./registry')(dependencies);

  function setJobState(id, state, callback) {
    registry.get(id, function(err, job) {
      if (err) {
        return callback(err);
      }

      if (!job) {
        return callback(new Error('No such job'));
      }

      job.state = state;
      job.updatedAt = new Date();
      registry.update(job, callback);
    });
  }

  function isJobRunning(id, callback) {
    registry.get(id, function(err, job) {
      callback(err, job && job.state && job.state === JOB_STATES.RUNNING);
    });
  }

  function _abortByFn(fn, context, callback) {
    fn(context, function(err, jobs) {
      if (err) {
        return callback(err);
      }

      if (!jobs || (Array.isArray(jobs) && !jobs.length)) {
        logger.debug('No jobs found for context', context);
        return callback();
      }

      if (!Array.isArray(jobs)) {
        jobs = [jobs];
      }

      async.each(jobs, function(job, cb) {
        var inMemory = registry.getInMemory(job.jobId);
        if (inMemory && inMemory.cronjob) {
          inMemory.cronjob.stop();
        }

        registry.remove(job.jobId, cb);
      }, callback);
    });
  }

  function abort(id, callback) {
    _abortByFn(registry.get, id, callback);
  }

  function abortByContext(context, callback) {
    _abortByFn(registry.getByExactContext, context, callback);
  }

  function abortAll(context, callback) {
    _abortByFn(registry.getAllBySubContext, context, callback);
  }

  function submit(description, cronTime, job, context, opts, callback) {
    description = description || 'No description';

    if (!callback) {
      callback = opts;
    }

    var onStopped = (opts && opts.onStopped) || function() {};
    var dbStorageOpt = opts && opts.dbStorage;

    if (!cronTime) {
      logger.error('Can not submit a cron job without a crontime');
      return callback(new Error('Crontime is required'));
    }

    if (!job) {
      logger.error('Can not submit an empty cron job');
      return callback(new Error('Job is required'));
    }

    if (typeof job !== 'function') {
      logger.error('Job must be a function');
      return callback(new Error('Job must be a function'));
    }

    var CronJob = cron.CronJob;
    var id = uuidV4();

    var jobWrapper = function() {
      logger.info('Job %s is starting', id);

      setJobState(id, 'running', function(err) {
        if (err) {
          logger.warn('Can not update the job state', err);
        }

        job(function(err) {
          logger.info('Job %s is complete', id);
          if (err) {
            logger.error('Job %s failed', id, err);
          }
          setJobState(id, err ? JOB_STATES.FAILED : JOB_STATES.COMPLETE, function(err) {
            if (err) {
              logger.warn('Can not update the job state', err);
            }
          });
        });
      });
    };

    var cronjob = new CronJob(cronTime, function() {
        isJobRunning(id, function(err, running) {
          if (running) {
            logger.error('Job %s is already running, skipping', id);
          } else {
            jobWrapper();
          }
        });
      }, function() {
        logger.info('Job %s is stopped', id);
        setJobState(id, JOB_STATES.STOPPED, function(err) {
          if (err) {
            logger.warn('Can not update the job state', err);
          }
          onStopped();
        });
      },
      true
    );

    function finishSubmit(err, saved) {
      if (err) {
        logger.warn('Error while storing the job', err);
      }
      cronjob.start();
      return callback(null, saved);
    }

    if (dbStorageOpt) {
      registry.store(id, description, cronjob, context, finishSubmit);
    } else {
      registry.storeInMemory(id, description, cronjob, context, finishSubmit);
    }
  }

  function reviveJobs(callback) {
    registry.getAll(function(err, jobs) {
      if (err) {
        return callback(err);
      }
      var topic = pubsub.local.topic(EVENTS.JOB_REVIVAL);
      async.each(jobs, function(job, cb) {
        if (job.state !== JOB_STATES.STOPPED) {
          topic.publish(job);
        }
        cb();
      }, callback);
    });
  }

  return {
    submit: submit,
    abort: abort,
    abortByContext: abortByContext,
    abortAll: abortAll,
    registry: registry,
    reviveJobs: reviveJobs
  };
};

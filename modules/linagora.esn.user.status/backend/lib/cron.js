'use strict';

const JOB_CRON_EXPRESSION = require('./constants').JOB_CRON_EXPRESSION;

module.exports = function(dependencies, lib) {

  const cron = dependencies('cron');
  const logger = dependencies('logger');
  const websocket = require('./websocket')(dependencies, lib);

  return {
    start
  };

  function start() {
    cron.submit('User status job', JOB_CRON_EXPRESSION, job, onJobComplete, (err, job) => {
      if (err) {
        return logger.error('Error while submitting the status job', err);
      }
      logger.debug('Status Job has been submitted', job);
    });
  }

  function job(callback) {
    websocket.updateLastActiveFromWebsocketConnections().then(result => {
      logger.debug('User status update job returned', result);
      callback(null, result);
    }, err => {
      logger.error('User status update job returned error', err);
      callback(err);
    });
  }

  function onJobComplete() {
    logger.debug('User status job is complete');
  }
};

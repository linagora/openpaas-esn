'use strict';

// Every weekday at 6:30 AM
var DEFAULT_TIMECRON = '00 30 06 * * 1-5';

module.exports = function(dependencies) {

  var cron = dependencies('cron');
  var logger = dependencies('logger');
  var config = dependencies('config')('cronjob');

  function getCronExpression() {
    if (!config || !config.dailydigest || !config.dailydigest.expression) {
      return DEFAULT_TIMECRON;
    }
    return config.dailydigest.expression;
  }

  function isActive() {
    return (config && config.dailydigest && config.dailydigest.active);
  }

  function getCronDescription() {
    return config && config.dailydigest && config.dailydigest.description ? config.dailydigest.description : 'Daily Digest';
  }

  function process(callback) {
    // To be filled
    logger.info('I am the job');
    return callback();
  }

  function init(callback) {
    callback = callback || function() {};

    if (!isActive()) {
      logger.info('Daily Digest Job is not active');
      return callback();
    }

    var onComplete = function() {
      logger.info('Daily Digest Job has been stopped');
    };

    cron.submit(getCronDescription(), getCronExpression(), process, onComplete, function(err, job) {
      if (err) {
        logger.error('Error while submitting the daily digest job', err);
        return callback(err);
      }
      logger.info('Daily Digest Job has been submitted', job);
      return callback();
    });
  }

  return {
    process: process,
    init: init
  };
};

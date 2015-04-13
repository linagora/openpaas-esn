'use strict';

// Every weekday at 6:30 AM
var DEFAULT_TIMECRON = '00 30 06 * * 1-5';

module.exports = function(dependencies) {

  var cron = dependencies('cron');
  var logger = dependencies('logger');
  var config = dependencies('config')('cronjob');
  var daily = require('./daily')(dependencies);

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
    logger.info('Running the daily digest job');
    daily.digest().then(function(result) {
      logger.debug('Daily digest has been run successfully');
      return callback(null, result);
    }, function(err) {
      logger.error('Got an error while running the daily digest', err);
      return callback(err);
    });
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

    cron.submit(getCronDescription(), getCronExpression(), process.bind(null, dependencies), onComplete, function(err, job) {
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

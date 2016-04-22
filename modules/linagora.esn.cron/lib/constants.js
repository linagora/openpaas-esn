'use strict';

module.exports.JOB_STATES = {
  CREATED: 'created',
  RUNNING: 'running',
  STOPPED: 'stopped',
  FAILED: 'failed',
  COMPLETE: 'complete'
};

module.exports.EVENTS = {
  JOB_REVIVAL: 'cron:job:revival'
};

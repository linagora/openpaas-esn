'use strict';

const constants = require('./constants');

module.exports = function(dependencies) {

  const models = {
    userStatus: require('./db/user-status')(dependencies)
  };

  const userStatus = require('./user-status')(dependencies);
  const listener = require('./listener')(dependencies, {userStatus});
  const cron = require('./cron')(dependencies, {userStatus});

  function start(callback) {
    listener.start();
    cron.start();
    callback();
  }

  return {
    constants,
    listener,
    models,
    start,
    userStatus
  };
};

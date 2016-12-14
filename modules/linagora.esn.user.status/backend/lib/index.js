'use strict';

const constants = require('./constants');

module.exports = function(dependencies) {

  const models = {
    userStatus: require('./db/user-status')(dependencies)
  };

  const task = require('./task')(dependencies);
  const userStatus = require('./user-status')(dependencies, {task});
  const listener = require('./listener')(dependencies, {userStatus});

  function start(callback) {
    listener.start();
  }

  return {
    constants,
    listener,
    models,
    start,
    userStatus
  };
};

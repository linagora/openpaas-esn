'use strict';

const constants = require('./constants');

module.exports = function(dependencies) {

  const models = {
    userStatus: require('./db/user-status')(dependencies)
  };

  const listener = require('./listener')(dependencies);
  const userStatus = require('./user-status')(dependencies);

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

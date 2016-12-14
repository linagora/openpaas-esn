'use strict';

const CONSTANTS = require('./constants');
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_DISCONNECTION = CONSTANTS.NOTIFICATIONS.USER_DISCONNECTION;
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DISCONNECTION_DELAY = CONSTANTS.STATUS.DISCONNECTION_DELAY;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const pubsubLocal = dependencies('pubsub').local;
  const userConnectionTopic = pubsubLocal.topic(USER_CONNECTION);
  const userDisconnectionTopic = pubsubLocal.topic(USER_DISCONNECTION);

  return {
    start
  };

  function userConnected(userId) {
    lib.userStatus.restorePreviousStatusOfUser(userId).then(status => {
      logger.debug(`User ${userId} status is restored to`, status.toJSON());
    });
  }

  function userDisconnected(userId) {
    lib.userStatus.set(userId, DISCONNECTED, DISCONNECTION_DELAY).then(status => {
      logger.debug(`User ${userId} status is stored as`, status.toJSON());
    });
  }

  function start() {
    userConnectionTopic.subscribe(userConnected);
    userDisconnectionTopic.subscribe(userDisconnected);
  }
};

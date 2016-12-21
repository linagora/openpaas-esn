'use strict';

const CONSTANTS = require('./constants');
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const CONNECTED = CONSTANTS.STATUS.CONNECTED;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const userConnectionTopic = pubsub.local.topic(USER_CONNECTION);
  const userStateTopic = pubsub.global.topic(USER_STATE);

  return {
    start,
    userConnected
  };

  function start() {
    userConnectionTopic.subscribe(userConnected);
  }

  function userConnected(userId) {
    return lib.userStatus.updateLastActiveForUser(userId).then(() => {
      const status = {_id: userId, status: CONNECTED};

      logger.debug(`User ${userId} connected, sharing connection status with other peers`);
      userStateTopic.publish(status);

      return status;
    });
  }
};

'use strict';

const CONSTANTS = require('./constants');
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const pubsubGlobal = dependencies('pubsub').global;
  const userStateTopic = pubsubGlobal.topic(USER_STATE);
  const delayedStateChanges = {};

  return {
    publishStatus
  };

  function publishStatus(userId, previousStatus, currentStatus, delay) {
    if (currentStatus.current_status !== (previousStatus && previousStatus.current_status || DISCONNECTED)) {
      delayedStateChanges[userId] && clearTimeout(delayedStateChanges[userId]);

      if (delay) {
        delayedStateChanges[userId] = setTimeout(() => {
          logger.debug('Pushing status for user %s after a delay of %s', userId, delay);
          userStateTopic.publish({userId, status: currentStatus});
          delete delayedStateChanges[userId];
        }, delay);

        return;
      }

      logger.debug('Pushing status without delay for user %s', userId);
      userStateTopic.publish({userId: userId, status: currentStatus});
    }
  }
};

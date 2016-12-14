'use strict';

const Q = require('q');
const CONSTANTS = require('./constants');
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DEFAULT_CONNECTED_STATE = CONSTANTS.STATUS.DEFAULT_CONNECTED_STATE;

module.exports = userStatus;

function userStatus(dependencies, lib) {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const UserStatus = mongoose.model('UserStatus');

  return {
    get,
    getAll,
    restorePreviousStatusOfUser,
    set
  };

  function get(userId) {
    logger.debug('Get user %s status', userId);

    return UserStatus.findById(userId).then(status => {
      if (!status) {
        return DISCONNECTED;
      }

      if ((Date.now() - status.timestamps.last_update) < status.delay) {
        return status.previous_status || DISCONNECTED;
      }

      return status.current_status;
    });
  }

  function getAll(userIds) {
    return Q.all(userIds.map(get));
  }

  function restorePreviousStatusOfUser(userId) {
    return UserStatus.findById(userId).then(status => set(userId, status && status.previous_status || DEFAULT_CONNECTED_STATE));
  }

  function set(userId, status, delay = 0) {
    logger.debug('Setting user %s status %s with delay %s', userId, status, delay);

    return UserStatus.findById(userId).then(previousStatus => {
      const nextStatus = {
        current_status: status,
        timestamps: {last_update: Date.now()},
        delay
      };

      if (status === DISCONNECTED && previousStatus) {
        nextStatus.previous_status = previousStatus.current_status === DISCONNECTED ? previousStatus.previous_status : previousStatus.current_status;
      }

      return UserStatus.findOneAndUpdate({_id: userId}, {$set: nextStatus}, {new: true, upsert: true, setDefaultsOnInsert: true}).then(updatedStatus => {
        lib.task.publishStatus(userId, previousStatus, updatedStatus, delay);

        return updatedStatus;
      });
    });
  }
}

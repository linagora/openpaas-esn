'use strict';

const Q = require('q');
const _ = require('lodash');
const CONSTANTS = require('./constants');
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
const USER_DISCONNECTION = CONSTANTS.NOTIFICATIONS.USER_DISCONNECTION;
const USER_STATE_KEY_PREFIX = 'userState:';
const DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
const DEFAULT_CONNECTED_STATE = CONSTANTS.STATUS.DEFAULT_CONNECTED_STATE;
const DISCONNECTION_DELAY = CONSTANTS.STATUS.DISCONNECTION_DELAY;

module.exports = userStatus;

function userStatus(dependencies) {

  const redisPromise = Q.ninvoke(dependencies('db').redis, 'getClient');
  const pubsubLocal = dependencies('pubsub').local;
  const pubsubGlobal = dependencies('pubsub').global;
  const userStateTopic = pubsubGlobal.topic(USER_STATE);
  const userConnectionTopic = pubsubLocal.topic(USER_CONNECTION);
  const userDisconnectionTopic = pubsubLocal.topic(USER_DISCONNECTION);
  const delayedStateChanges = {};

  return {
    get,
    getAll,
    init,
    restorePreviousState,
    set
  };

  function set(userId, state, delay) {
    return redisPromise.then(redis => {
      const key = USER_STATE_KEY_PREFIX + userId;

      return Q.ninvoke(redis, 'hgetall', key).then(function(previousData) {
        const data = {
          state: state,
          since: Date.now(),
          delay: delay || 0
        };

        if (state === DISCONNECTED && previousData) {
          data.previousState = previousData.state === DISCONNECTED ? previousData.previousState : previousData.state;
        }

        if ((data.state) !== (previousData && previousData.state || DISCONNECTED)) {
          delayedStateChanges[userId] && clearTimeout(delayedStateChanges[userId]);
          if (delay) {
            delayedStateChanges[userId] = setTimeout(function() {
              userStateTopic.publish({userId, state});
              delete delayedStateChanges[userId];
            }, delay);
          } else {
            userStateTopic.publish({userId, state});
          }
        }

        return Q.ninvoke(redis, 'hmset', key, data);
      });
    });
  }

  function restorePreviousState(userId) {
    return redisPromise.then(redis =>
      Q.ninvoke(redis, 'hgetall', USER_STATE_KEY_PREFIX + userId).then(data => set(userId, data && data.previousState || DEFAULT_CONNECTED_STATE))
    );
  }

  function get(userId) {
    return redisPromise.then(redis =>
      Q.ninvoke(redis, 'hgetall', USER_STATE_KEY_PREFIX + userId).then(data => {
        if (!data) {
          return DISCONNECTED;
        }

        if ((Date.now() - data.since) < data.delay) {
          return data.previousState || DISCONNECTED;
        }

        return data.state;
      })
    );
  }

  function getAll(userIds) {
    return Q.all(userIds.map(get));
  }

  function init() {
    userConnectionTopic.subscribe(restorePreviousState);
    userDisconnectionTopic.subscribe(_.partialRight(set, DISCONNECTED, DISCONNECTION_DELAY));
  }
}

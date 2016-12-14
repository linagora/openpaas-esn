'use strict';

module.exports = {
  WEBSOCKET: {
    NAMESPACE: 'userstatus'
  },
  STATUS: {
    DISCONNECTION_DELAY: 10000, //in milliseconds
    DISCONNECTED: 'disconnected',
    CONNECTED: 'connected',
    DEFAULT: 'connected'
  },
  NOTIFICATIONS: {
    USER_STATE: 'user:status',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection'
  }
};

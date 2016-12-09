'use strict';

module.exports = {
  WEBSOCKET: {
    NAMESPACE: 'userstatus'
  },
  STATUS: {
    DISCONNECTION_DELAY: 10000, //in milliseconds
    DISCONNECTED: 'disconnected',
    DEFAULT_CONNECTED_STATE: 'connected'
  },
  NOTIFICATIONS: {
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection'
  }
};

'use strict';

module.exports = {
  WEBSOCKET: {
    NAMESPACE: 'userstatus'
  },
  JOB_CRON_EXPRESSION: '0 * * * * *',
  DISCONNECTED_DELAY: 60000, //in milliseconds
  STATUS: {
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

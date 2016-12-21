'use strict';

module.exports = {
  MODE: {
    IMPORT: 'import'
  },
  NOTIFICATIONS: {
    EVENT_ADDED: 'events:event:add',
    EVENT_UPDATED: 'events:event:update',
    EVENT_DELETED: 'events:event:delete'
  },
  SEARCH: {
    INDEX_NAME: 'events.idx',
    TYPE_NAME: 'events',
    DEFAULT_LIMIT: 20,
    DEFAULT_SORT_KEY: 'start',
    DEFAULT_SORT_ORDER: 'desc'
  },
  VALARM_ACTIONS: {
    DISPLAY: 'DISPLAY',
    EMAIL: 'EMAIL'
  },
  WS_EVENT: {
    EVENT_CREATED: 'calendar:ws:event:created',
    EVENT_UPDATED: 'calendar:ws:event:updated',
    EVENT_REQUEST: 'calendar:ws:event:request',
    EVENT_CANCEL: 'calendar:ws:event:cancel',
    EVENT_DELETED: 'calendar:ws:event:deleted',
    EVENT_REPLY: 'calendar:ws:event:reply'
  }
};

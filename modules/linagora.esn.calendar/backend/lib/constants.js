'use strict';

module.exports = {
  EVENT_MAIL_LISTENER: {
    FALLBACK_EXCHANGE: 'james:events'
  },
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
    EVENT_CREATED: 'calendar:event:created',
    EVENT_UPDATED: 'calendar:event:updated',
    EVENT_REQUEST: 'calendar:event:request',
    EVENT_CANCEL: 'calendar:event:cancel',
    EVENT_DELETED: 'calendar:event:deleted',
    EVENT_REPLY: 'calendar:event:reply'
  }
};

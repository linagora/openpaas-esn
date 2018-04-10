'use strict';

module.exports = {
  MODE: {
    IMPORT: 'import'
  },
  NOTIFICATIONS: {
    CONTACT_ADDED: 'contacts:contact:add',
    CONTACT_UPDATED: 'contacts:contact:update',
    CONTACT_DELETED: 'contacts:contact:delete',
    ADDRESSBOOK_DELETED: 'contacts:addressbook:deleted'
  },
  GLOBAL_PUBSUB_EVENTS: {
    SABRE: {
      CONTACT_CREATED: 'sabre:contact:created',
      CONTACT_UPDATED: 'sabre:contact:updated',
      CONTACT_MOVED: 'sabre:contact:moved',
      CONTACT_DELETED: 'sabre:contact:deleted',
      ADDRESSBOOK_DELETED: 'sabre:addressbook:deleted'
    }
  },
  SEARCH: {
    INDEX_NAME: 'contacts.idx',
    TYPE_NAME: 'contacts',
    DEFAULT_LIMIT: 20
  },
  AVAILABLE_ADDRESSBOOK_TYPES: {
    USER: 'user',
    SUBSCRIPTION: 'subscription'
  }
};

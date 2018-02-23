'use strict';

module.exports = {
  MODE: {
    IMPORT: 'import'
  },
  NOTIFICATIONS: {
    CONTACT_ADDED: 'contacts:contact:add',
    CONTACT_UPDATED: 'contacts:contact:update',
    CONTACT_DELETED: 'contacts:contact:delete'
  },
  SEARCH: {
    INDEX_NAME: 'contacts.idx',
    TYPE_NAME: 'contacts',
    DEFAULT_LIMIT: 20
  },
  AVAILABLE_ADDRESSBOOK_TYPES: ['user']
};

'use strict';

module.exports = {
  MODE: {
    IMPORT: 'import'
  },
  NOTIFICATIONS: {
    CONTACT_ADDED: 'contacts:contact:add',
    CONTACT_UPDATED: 'contacts:contact:update',
    CONTACT_DELETED: 'contacts:contact:delete',
    ADDRESSBOOK_CREATED: 'contacts:addressbook:created',
    ADDRESSBOOK_DELETED: 'contacts:addressbook:deleted',
    ADDRESSBOOK_UPDATED: 'contacts:addressbook:updated',
    ADDRESSBOOK_SUBSCRIPTION_DELETED: 'contacts:addressbook:subscription:deleted',
    ADDRESSBOOK_SUBSCRIPTION_UPDATED: 'contacts:addressbook:subscription:updated',
    ADDRESSBOOK_SUBSCRIPTION_CREATED: 'contacts:addressbook:subscription:created'
  },
  ELASTICSEARCH_EVENTS: {
    CONTACT_ADDED: 'elasticsearch:contact:added',
    CONTACT_UPDATED: 'elasticsearch:contact:updated',
    CONTACT_DELETED: 'elasticsearch:contact:deleted'
  },
  GLOBAL_PUBSUB_EVENTS: {
    SABRE: {
      CONTACT_CREATED: 'sabre:contact:created',
      CONTACT_UPDATED: 'sabre:contact:updated',
      CONTACT_DELETED: 'sabre:contact:deleted',
      ADDRESSBOOK_CREATED: 'sabre:addressbook:created',
      ADDRESSBOOK_DELETED: 'sabre:addressbook:deleted',
      ADDRESSBOOK_UPDATED: 'sabre:addressbook:updated',
      ADDRESSBOOK_SUBSCRIPTION_DELETED: 'sabre:addressbook:subscription:deleted',
      ADDRESSBOOK_SUBSCRIPTION_UPDATED: 'sabre:addressbook:subscription:updated',
      ADDRESSBOOK_SUBSCRIPTION_CREATED: 'sabre:addressbook:subscription:created'
    }
  },
  SEARCH: {
    INDEX_NAME: 'contacts.idx',
    TYPE_NAME: 'contacts',
    DEFAULT_LIMIT: 20
  },
  AVAILABLE_ADDRESSBOOK_TYPES: {
    USER: 'user',
    SUBSCRIPTION: 'subscription',
    GROUP: 'group'
  },
  SHARING_INVITE_STATUS: {
    NORESPONSE: 1,
    ACCEPTED: 2,
    DECLINED: 3,
    INVALID: 4
  }
};

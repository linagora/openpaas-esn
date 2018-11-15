(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .constant('DEFAULT_DOMAIN_ADDRESSBOOK_NAME', 'dab')
    .constant('CONTACT_ADDRESSBOOK_EVENTS', {
      CREATED: 'contact:addressbook:created',
      DELETED: 'contact:addressbook:deleted',
      UPDATED: 'contact:addressbook:updated',
      SUBSCRIPTION_DELETED: 'contact:addressbook:subscription:deleted',
      SUBSCRIPTION_UPDATED: 'contact:addressbook:subscription:updated'
    })
    .constant('CONTACT_ADDRESSBOOK_TYPES', {
      user: 'user',
      subscription: 'subscription',
      virtual: 'virtual',
      group: 'group'
    })
    .constant('CONTACT_ADDRESSBOOK_STATES', {
      enabled: 'enabled',
      disabled: 'disabled'
    })
    .constant('CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL', '{DAV:}authenticated')
    .constant('CONTACT_ADDRESSBOOK_PUBLIC_RIGHT', {
      PRIVATE: {
        value: '',
        label: 'Private',
        longLabel: 'Hide address book',
        score: 0
      },
      READ: {
        value: '{DAV:}read',
        label: 'Read',
        longLabel: 'See all contacts',
        score: 1
      },
      WRITE: {
        value: '{DAV:}write',
        label: 'Read/Write',
        longLabel: 'Edit all contacts',
        score: 2
      }
    })
    .constant('CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS', {
      READ: {
        value: ['{DAV:}read'],
        label: 'Read',
        longLabel: 'See all contacts'
      },
      WRITE: {
        value: ['{DAV:}read', '{DAV:}write-content', '{DAV:}bind', '{DAV:}unbind'],
        label: 'Read/Write',
        longLabel: 'Edit all contacts'
      }
    });
})(angular);

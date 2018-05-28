(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .constant('CONTACT_ADDRESSBOOK_EVENTS', {
      CREATED: 'contact:addressbook:created',
      DELETED: 'contact:addressbook:deleted',
      UPDATED: 'contact:addressbook:updated'
    })
    .constant('CONTACT_ADDRESSBOOK_TYPES', {
      user: 'user',
      subscription: 'subscription'
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
    });
})(angular);

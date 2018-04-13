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
        longLabel: 'Hide address book'
      },
      READ: {
        value: '{DAV:}read',
        label: 'Read',
        longLabel: 'See all contacts'
      },
      WRITE: {
        value: '{DAV:}write',
        label: 'Read/Write',
        longLabel: 'Edit address book'
      }
    });
})(angular);

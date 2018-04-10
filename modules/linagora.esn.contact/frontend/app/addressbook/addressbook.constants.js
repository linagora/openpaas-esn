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
    });
})(angular);

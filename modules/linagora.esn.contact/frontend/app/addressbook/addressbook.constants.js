(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .constant('CONTACT_ADDRESSBOOK_EVENTS', {
      CREATED: 'contact:addressbook:created',
      DELETED: 'contact:addressbook:removed',
      UPDATED: 'contact:addressbook:updated'
    })
    .constant('CONTACT_USER_ADDRESSBOOK_TYPE', 'user');
})(angular);

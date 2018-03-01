(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactSidebarAddressbookItem', {
      templateUrl: '/contact/app/sidebar/addressbook-item/contact-sidebar-addressbook-item.html',
      controller: 'ContactSidebarAddressbookItemController',
      bindings: {
        addressbook: '<'
      }
    });
})(angular);

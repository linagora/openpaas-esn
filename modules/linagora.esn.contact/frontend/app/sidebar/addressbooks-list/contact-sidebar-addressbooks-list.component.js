(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactSidebarAddressbooksList', {
      templateUrl: '/contact/app/sidebar/addressbooks-list/contact-sidebar-addressbooks-list.html',
      bindings: {
        addressbooks: '=',
        title: '<'
      }
    });
})(angular);

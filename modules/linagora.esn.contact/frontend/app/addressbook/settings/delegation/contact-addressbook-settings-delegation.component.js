(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSettingsDelegation', {
      templateUrl: '/contact/app/addressbook/settings/delegation/contact-addressbook-settings-delegation.html',
      controller: 'contactAddressbookSettingsDelegationController',
      bindings: {
        sharees: '='
      }
    });
})(angular);

(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSettingsMain', {
      templateUrl: '/contact/app/addressbook/settings/main/contact-addressbook-settings-main.html',
      controller: 'contactAddressbookSettingsMainController',
      bindings: {
        addressbook: '<',
        publicRight: '='
      }
    });
})(angular);

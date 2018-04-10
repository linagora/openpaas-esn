(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .component('contactAddressbookSharedConfigurationItem', {
      bindings: {
        addressbook: '='
      },
      templateUrl: '/contact/app/addressbook/addressbook-shared-configuration/item/addressbook-shared-configuration-item.html',
      controller: 'contactAddressbookSharedConfigurationItemController'
    });
})(angular);

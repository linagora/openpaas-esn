(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(
      contactAddressbookDisplayShellRegistry,
      contactUserAddressbookService,
      ContactUserAddressbookDisplayShell
    ) {
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.user-addressbook',
        priority: 100,
        displayShell: ContactUserAddressbookDisplayShell,
        matchingFunction: contactUserAddressbookService.isUserAddressbook
      });
    });
})(angular);

(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(
      contactAddressbookActionEdit,
      contactAddressbookActionDelete,
      contactAddressbookDisplayShellRegistry,
      contactUserAddressbookService,
      ContactUserAddressbookDisplayShell
    ) {
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.user-addressbook',
        priority: 100,
        actions: [
          contactAddressbookActionEdit,
          contactAddressbookActionDelete
        ],
        displayShell: ContactUserAddressbookDisplayShell,
        matchingFunction: contactUserAddressbookService.isUserAddressbook
      });
    });
})(angular);

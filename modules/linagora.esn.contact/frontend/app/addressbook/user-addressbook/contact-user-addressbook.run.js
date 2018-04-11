(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(
      contactAddressbookActionEdit,
      contactAddressbookActionDelete,
      contactAddressbookActionSettings,
      contactAddressbookDisplayShellRegistry,
      contactUserAddressbookService,
      ContactUserAddressbookDisplayShell
    ) {
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.user-addressbook',
        priority: 100,
        actions: [
          contactAddressbookActionEdit,
          contactAddressbookActionDelete,
          contactAddressbookActionSettings
        ],
        displayShell: ContactUserAddressbookDisplayShell,
        matchingFunction: contactUserAddressbookService.isUserAddressbook
      });
    });
})(angular);

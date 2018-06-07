(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(
      contactAddressbookActionEdit,
      contactAddressbookActionDelete,
      contactAddressbookActionExport,
      contactAddressbookActionSettings,
      contactAddressbookDisplayShellRegistry,
      contactUserAddressbookService,
      ContactUserAddressbookDisplayShell
    ) {
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.user-addressbook',
        priority: 100,
        actions: [
          contactAddressbookActionExport,
          contactAddressbookActionSettings,
          contactAddressbookActionEdit,
          contactAddressbookActionDelete
        ],
        displayShell: ContactUserAddressbookDisplayShell,
        matchingFunction: contactUserAddressbookService.isUserAddressbook
      });
    });
})(angular);

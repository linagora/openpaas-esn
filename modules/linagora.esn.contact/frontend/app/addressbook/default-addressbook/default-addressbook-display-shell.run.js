(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(registerDefaultAddressbookDisplayShell);

  function registerDefaultAddressbookDisplayShell(
    contactAddressbookDisplayShellRegistry,
    ContactDefaultAddressbookDisplayShell,
    contactDefaultAddressbookHelper,
    contactAddressbookActionEdit,
    contactAddressbookActionDelete
  ) {
    contactAddressbookDisplayShellRegistry.add({
      id: 'linagora.esn.contact',
      priority: 1,
      actions: [
        contactAddressbookActionEdit,
        contactAddressbookActionDelete
      ],
      displayShell: ContactDefaultAddressbookDisplayShell,
      matchingFunction: contactDefaultAddressbookHelper.isDefaultAddressbook
    });
  }
})(angular);

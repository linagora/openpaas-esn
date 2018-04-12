(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(registerDefaultAddressbookDisplayShell);

  function registerDefaultAddressbookDisplayShell(
    contactAddressbookDisplayShellRegistry,
    ContactDefaultAddressbookDisplayShell,
    contactDefaultAddressbookHelper,
    contactAddressbookActionEdit,
    contactAddressbookActionDelete,
    contactAddressbookActionSettings
  ) {
    contactAddressbookDisplayShellRegistry.add({
      id: 'linagora.esn.contact',
      priority: 1,
      actions: [
        contactAddressbookActionEdit,
        contactAddressbookActionDelete,
        contactAddressbookActionSettings
      ],
      displayShell: ContactDefaultAddressbookDisplayShell,
      matchingFunction: contactDefaultAddressbookHelper.isDefaultAddressbook
    });
  }
})(angular);

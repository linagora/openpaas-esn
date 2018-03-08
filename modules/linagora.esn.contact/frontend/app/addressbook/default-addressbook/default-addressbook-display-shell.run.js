(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(registerDefaultAddressbookDisplayShell);

  function registerDefaultAddressbookDisplayShell(
    contactAddressbookDisplayShellRegistry,
    ContactDefaultAddressbookDisplayShell,
    contactDefaultAddressbookHelper
  ) {
    contactAddressbookDisplayShellRegistry.add({
      id: 'linagora.esn.contact',
      priority: 1,
      displayShell: ContactDefaultAddressbookDisplayShell,
      matchingFunction: contactDefaultAddressbookHelper.isDefaultAddressbook
    });
  }
})(angular);

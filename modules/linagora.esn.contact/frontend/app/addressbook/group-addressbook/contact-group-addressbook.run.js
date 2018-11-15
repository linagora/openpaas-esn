(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(
      contactAddressbookActionEdit,
      contactAddressbookActionExport,
      contactAddressbookActionSettings,
      contactAddressbookDisplayShellRegistry,
      contactGroupAddressbookService,
      ContactGroupAddressbookDisplayShell
    ) {
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.group-addressbook',
        priority: 100,
        actions: [
          contactAddressbookActionExport,
          contactAddressbookActionSettings,
          contactAddressbookActionEdit
        ],
        displayShell: ContactGroupAddressbookDisplayShell,
        matchingFunction: contactGroupAddressbookService.isGroupAddressbook
      });
    });
})(angular);

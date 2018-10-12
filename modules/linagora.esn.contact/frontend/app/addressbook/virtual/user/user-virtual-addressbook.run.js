(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(VirtualAddressBookRegistry, ContactUserVirtualAddressBook, DisplayShellProvider, ContactUserDisplayShell, ContactUserShellHelper, contactAddressbookDisplayShellRegistry, ContactUserVirtualAddressBookDisplayShell) {
      VirtualAddressBookRegistry.put(ContactUserVirtualAddressBook);
      DisplayShellProvider.addDisplayShell(ContactUserDisplayShell, ContactUserShellHelper.isUser);
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.virtual.users',
        priority: 20,
        displayShell: ContactUserVirtualAddressBookDisplayShell,
        matchingFunction: ContactUserShellHelper.isAddressbook
      });
    });
})(angular);

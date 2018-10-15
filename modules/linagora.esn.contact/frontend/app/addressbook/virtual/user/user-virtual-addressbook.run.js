(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(ContactVirtualAddressBookRegistry, ContactUserVirtualAddressBook, DisplayShellProvider, ContactUserDisplayShell, ContactUserShellHelper, contactAddressbookDisplayShellRegistry, ContactUserVirtualAddressBookDisplayShell) {
      ContactVirtualAddressBookRegistry.put(ContactUserVirtualAddressBook);
      DisplayShellProvider.addDisplayShell(ContactUserDisplayShell, ContactUserShellHelper.isUser);
      contactAddressbookDisplayShellRegistry.add({
        id: 'linagora.esn.contact.virtual.users',
        priority: 20,
        displayShell: ContactUserVirtualAddressBookDisplayShell,
        matchingFunction: ContactUserShellHelper.isAddressbook
      });
    });
})(angular);

(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(
    ContactVirtualAddressBookRegistry,
    ContactUserVirtualAddressBook,
    DisplayShellProvider,
    ContactUserDisplayShell,
    ContactUserShellHelper,
    contactAddressbookDisplayShellRegistry,
    ContactUserVirtualAddressBookDisplayShell,
    CONTACT_USER_VIRTUAL_ADDRESSBOOK_ID,
    contactConfiguration
  ) {
    contactConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      ContactVirtualAddressBookRegistry.put(ContactUserVirtualAddressBook);
      DisplayShellProvider.addDisplayShell(ContactUserDisplayShell, ContactUserShellHelper.isUser);
      contactAddressbookDisplayShellRegistry.add({
        id: CONTACT_USER_VIRTUAL_ADDRESSBOOK_ID,
        priority: 20,
        displayShell: ContactUserVirtualAddressBookDisplayShell,
        matchingFunction: ContactUserShellHelper.isAddressbook
      });
    });
  }
})(angular);

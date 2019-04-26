(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').run(runBlock);

  function runBlock(
    ContactVirtualAddressBookRegistry,
    ContactFollowingVirtualAddressBook,
    DisplayShellProvider,
    ContactUserDisplayShell,
    ContactUserShellHelper,
    contactAddressbookDisplayShellRegistry,
    ContactUserVirtualAddressBookDisplayShell,
    CONTACT_FOLLOWING_VIRTUAL_ADDRESSBOOK_ID,
    contactConfiguration
  ) {
    contactConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      ContactVirtualAddressBookRegistry.put(ContactFollowingVirtualAddressBook);
      DisplayShellProvider.addDisplayShell(ContactUserDisplayShell, ContactUserShellHelper.isUser);
      contactAddressbookDisplayShellRegistry.add({
        id: CONTACT_FOLLOWING_VIRTUAL_ADDRESSBOOK_ID,
        priority: 30,
        displayShell: ContactUserVirtualAddressBookDisplayShell,
        matchingFunction: ContactUserShellHelper.isAddressbook
      });
    });
  }
})(angular);

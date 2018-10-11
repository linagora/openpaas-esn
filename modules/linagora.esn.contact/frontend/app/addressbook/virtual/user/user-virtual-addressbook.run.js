(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .run(function(VirtualAddressBookRegistry, ContactUserVirtualAddressBook, DisplayShellProvider, ContactUserDisplayShell, ContactUserShellHelper) {
      VirtualAddressBookRegistry.put(ContactUserVirtualAddressBook);
      DisplayShellProvider.addDisplayShell(ContactUserDisplayShell, ContactUserShellHelper.isUser);
    });
})(angular);

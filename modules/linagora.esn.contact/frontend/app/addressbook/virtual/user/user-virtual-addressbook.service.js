(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserVirtualAddressBook', ContactUserVirtualAddressBook);

  function ContactUserVirtualAddressBook(ContactVirtualAddressBook, ContactUserShell, ContactVirtualUsersLoaderService, CONTACT_USER_VIRTUAL_ADDRESSBOOK_ID) {
    var options = {
      configuration: {
        enabled: 'linagora.esn.contact.features.isVirtualUserAddressbookEnabled'
      }
    };
    var addressbook = new ContactVirtualAddressBook(CONTACT_USER_VIRTUAL_ADDRESSBOOK_ID, 'All members', loadNextItems, options);

    function loadNextItems(options) {
      return ContactVirtualUsersLoaderService.list(options).then(function(result) {
        if (result && result.data && result.data.length) {
          result.data = result.data.map(function(user) {
            return new ContactUserShell(user, addressbook);
          });
        }

        return result;
      });
    }

    return addressbook;
  }
})(angular);

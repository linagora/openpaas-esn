(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactFollowingVirtualAddressBook', ContactFollowingVirtualAddressBook);

  function ContactFollowingVirtualAddressBook(ContactVirtualAddressBook, ContactUserShell, ContactVirtualFollowingsLoaderService, CONTACT_FOLLOWING_VIRTUAL_ADDRESSBOOK_ID) {
    var options = {
      configuration: {
        enabled: 'linagora.esn.contact.features.isVirtualFollowingAddressbookEnabled'
      },
      excludeFromAggregate: true
    };
    var addressbook = new ContactVirtualAddressBook(CONTACT_FOLLOWING_VIRTUAL_ADDRESSBOOK_ID, 'Followed Members', loadNextItems, options);

    function loadNextItems(options) {
      return ContactVirtualFollowingsLoaderService.list(options).then(function(result) {
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

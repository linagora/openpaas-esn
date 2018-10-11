(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactUserVirtualAddressBook', ContactUserVirtualAddressBook);

  function ContactUserVirtualAddressBook(ContactVirtualAddressBook, ContactUserShell, MemberPaginationProvider) {
    var provider;
    var addressbook = new ContactVirtualAddressBook('openpaas-users', 'Users', loadNextItems);

    function loadNextItems(options) {
      if (!provider) {
        provider = new MemberPaginationProvider(options);
      }

      return provider.loadNextItems().then(function(result) {
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

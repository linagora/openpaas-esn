(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactVirtualAddressBook', ContactVirtualAddressBook);

  function ContactVirtualAddressBook(CONTACT_ADDRESSBOOK_TYPES) {
    function ContactVirtualAddressBook(id, name, loadNextItems) {
      this.id = id;
      this.name = name;
      this.type = CONTACT_ADDRESSBOOK_TYPES.VIRTUAL;
      this.description = 'OpenPaaS Platform users';
      this.loadNextItems = loadNextItems;
    }

    return ContactVirtualAddressBook;
  }
})(angular);

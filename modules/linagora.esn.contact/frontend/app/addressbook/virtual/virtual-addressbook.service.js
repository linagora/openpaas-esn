(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactVirtualAddressBook', ContactVirtualAddressBook);

  function ContactVirtualAddressBook() {
    function ContactVirtualAddressBook(id, name, loadNextItems) {
      this.id = id;
      this.name = name;
      this.type = 'virtual';
      this.description = 'OpenPaaS Platform users';
      this.loadNextItems = loadNextItems;
    }

    return ContactVirtualAddressBook;
  }
})(angular);

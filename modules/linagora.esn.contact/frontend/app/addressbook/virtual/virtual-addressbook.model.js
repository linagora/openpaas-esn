(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactVirtualAddressBook', ContactVirtualAddressBook);

  function ContactVirtualAddressBook(CONTACT_ADDRESSBOOK_TYPES) {
    function ContactVirtualAddressBook(id, name, loadNextItems, getContactsCount, options) {
      this.id = id;
      this.name = name;
      this.bookId = 'virtual';
      this.bookName = id;
      this.type = CONTACT_ADDRESSBOOK_TYPES.virtual;
      this.description = 'Virtual addressbook';
      this.loadNextItems = loadNextItems;
      this.getContactsCount = getContactsCount;
      this.options = options;
      this.excludeFromAggregate = options && options.excludeFromAggregate;
    }

    ContactVirtualAddressBook.prototype.loadContactsCount = loadContactsCount;

    function loadContactsCount() {
      var self = this;

      return self.getContactsCount().then(function(count) {
        self.numberOfContacts = count;
      });
    }

    return ContactVirtualAddressBook;
  }
})(angular);

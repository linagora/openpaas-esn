(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressBookPaginationProvider', AddressBookPaginationProvider);

  function AddressBookPaginationProvider(contactService, $log) {

    function AddressBookPaginationProvider(options) {
      this.options = options;

      if (!this.options.addressbooks || this.options.addressbooks.length === 0) {
        throw new Error('options.addressbooks array is required');
      }

      this.addressbook = this.options.addressbooks[0];
      this.lastPage = false;
      this.nextPage = 0;
    }

    AddressBookPaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      var page = this.nextPage || 1;

      $log.debug('Load contacts page %s on ab', page, this.addressbook);

      return contactService.listContacts(this.addressbook, {
          userId: this.options.user._id,
          page: page,
          paginate: true
        }).then(function(result) {
          self.lastPage = result.last_page;
          result.lastPage = result.last_page;
          self.nextPage = result.next_page;

          return result;
        });
    };

    return AddressBookPaginationProvider;
  }
})(angular);

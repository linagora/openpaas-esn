(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactVirtualAddressBookPaginationProvider', ContactVirtualAddressBookPaginationProvider);

  function ContactVirtualAddressBookPaginationProvider($log) {

    function ContactVirtualAddressBookPaginationProvider(options) {
      this.options = options;

      if (!this.options.addressbooks || this.options.addressbooks.length === 0) {
        throw new Error('options.addressbooks array is required');
      }

      this.addressbook = this.options.addressbooks[0];
      this.lastPage = false;
      this.nextPage = 1;
    }

    ContactVirtualAddressBookPaginationProvider.prototype.loadNextItems = function() {
      var self = this;
      var page = this.nextPage || 1;

      $log.debug('Load contacts page %s on virtual ab', page, this.addressbook);

      return this.addressbook.loadNextItems({
        userId: this.options.user._id,
        page: page,
        paginate: true
      }).then(function(result) {
        self.lastPage = result.lastPage;
        if (!self.lastPage) {
          self.nextPage++;
        }

        return result;
      });
    };

    return ContactVirtualAddressBookPaginationProvider;
  }
})(angular);

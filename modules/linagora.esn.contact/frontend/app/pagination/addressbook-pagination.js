(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressBookPagination', AddressBookPagination);

  function AddressBookPagination(
    AddressBookPaginationService,
    AddressBookPaginationRegistry
  ) {

    function AddressBookPagination(scope) {
      this.scope = scope;
    }

    AddressBookPagination.prototype.init = function(provider, options) {
      if (this.lastPageWatcher) {
        this.lastPageWatcher.stop();
      }
      var PaginationProvider = AddressBookPaginationRegistry.get(provider);

      if (!PaginationProvider) {
        throw new Error('Unknown provider ' + provider);
      }

      this.provider = new PaginationProvider(options);
      this.service = new AddressBookPaginationService(this.provider);
      this.lastPageWatcher = new LastPageWatcher(this.scope, this.service);
    };

    function LastPageWatcher(scope, addressBookPaginationService) {
      var self = this;

      this.scope = scope;
      this.scope.lastPage = false;
      this.addressBookPaginationService = addressBookPaginationService;

      this.unbindWatch = scope.$watch(function() {
        return self.addressBookPaginationService.lastPage;
      }, function(newVal, oldVal) {
        if (newVal !== oldVal) {
          self.scope.lastPage = newVal;
        }

        if (self.scope.lastPage) {
          self.unbindWatch();
        }
      });
    }

    LastPageWatcher.prototype.stop = function() {
      this.unbindWatch();
    };

    return AddressBookPagination;
  }
})(angular);

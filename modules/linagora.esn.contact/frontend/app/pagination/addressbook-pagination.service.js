(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressBookPaginationService', AddressBookPaginationService);

  function AddressBookPaginationService() {
    function AddressBookPaginationService(provider) {
      this.provider = provider;
      this.lastPage = false;
    }

    AddressBookPaginationService.prototype.loadNextItems = function(options) {
      var self = this;

      return this.provider.loadNextItems(options).then(function(result) {
        self.lastPage = result.lastPage;

        return result;
      });
    };

    return AddressBookPaginationService;
  }
})(angular);

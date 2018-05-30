(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('SearchAddressBookPaginationProvider', SearchAddressBookPaginationProvider);

  function SearchAddressBookPaginationProvider($log, ContactAPIClient) {

    function SearchAddressBookPaginationProvider(options) {
      this.options = options;
      this.user = this.options.user;
      this.bookId = this.user._id;
      this.totalHits = 0;
      this.lastPage = false;
      this.nextPage = 0;
    }

    SearchAddressBookPaginationProvider.prototype.loadNextItems = function(options) {
      var self = this;
      var page = this.nextPage || 1;

      $log.debug('Search contacts page %s for bookId %s', page, this.bookId);

      var query = {
        data: options.searchInput,
        userId: this.options.user._id,
        page: page
      };

      return ContactAPIClient
        .addressbookHome(this.bookId)
        .search(query)
        .then(function(result) {
          self.currentPage = result.current_page;
          self.totalHits = self.totalHits + result.data.length;
          self.nextPage = result.next_page;
          if (self.totalHits === result.total_hits) {
            self.lastPage = true;
          }
          result.lastPage = self.lastPage;

          return result;
        });
    };

    return SearchAddressBookPaginationProvider;
  }
})(angular);

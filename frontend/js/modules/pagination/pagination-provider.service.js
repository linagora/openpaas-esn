(function() {
  'use strict';

  angular.module('esn.pagination')
    .factory('esnPaginationProvider', esnPaginationProvider);

  function esnPaginationProvider(ESN_PAGINATION_DEFAULT_LIMIT) {
    function PaginationProvider(paginable, options) {
      this.paginable = paginable;
      this.options = angular.extend({limit: ESN_PAGINATION_DEFAULT_LIMIT, offset: 0}, options);
    }

    PaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      return self.paginable(self.options).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < self.options.limit)
        };

        if (!result.lastPage) {
          self.options.offset += self.options.limit;
        }

        return result;
      });
    };

    return PaginationProvider;
  }
})();

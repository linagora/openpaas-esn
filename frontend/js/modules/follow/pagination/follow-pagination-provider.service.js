(function(angular) {
  'use strict';

  angular.module('esn.follow').factory('FollowPaginationProvider', FollowPaginationProvider);

  function FollowPaginationProvider() {

    function FollowPaginationProvider(paginable, options, user) {
      this.paginable = paginable;
      this.options = angular.extend({limit: 20, offset: 0}, options);
      this.user = user;
    }

    FollowPaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      return self.paginable(self.user, self.options).then(function(response) {
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

    return FollowPaginationProvider;
  }
})(angular);

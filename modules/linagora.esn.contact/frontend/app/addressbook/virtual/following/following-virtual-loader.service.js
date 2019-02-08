(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactVirtualFollowingsLoaderService', ContactVirtualFollowingsLoaderService);

  function ContactVirtualFollowingsLoaderService(followAPI, session, CONTACT_LIST_PAGE_SIZE) {
    return {
      getFollowingsCount: getFollowingsCount,
      list: list
    };

    function list(options) {
      var query = {};
      var currentPage = options.page || 1;
      var limit = options.limit || CONTACT_LIST_PAGE_SIZE;
      var offset = (currentPage - 1) * limit;

      if (options.paginate) {
        query.limit = limit;
        query.offset = offset;
      }

      return followAPI.getFollowings(session.user, query).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < query.limit)
        };

        return result;
      });
    }

    function getFollowingsCount() {
      return followAPI.getFollowingsHeaders(session.user).then(function(response) {
        return parseInt(response.headers('X-ESN-Items-Count'), 10);
      });
    }
  }
})(angular);

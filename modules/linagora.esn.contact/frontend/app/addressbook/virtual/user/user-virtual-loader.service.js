(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactVirtualUsersLoaderService', ContactVirtualUsersLoaderService);

  function ContactVirtualUsersLoaderService(domainAPI, session, CONTACT_LIST_PAGE_SIZE) {
    return {
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

      return domainAPI.getMembers(session.domain._id, query).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < query.limit)
        };

        return result;
      });
    }
  }
})(angular);

(function(angular) {
  'use strict';

  angular.module('esn.people').factory('esnPeopleAPI', esnPeopleAPI);

  function esnPeopleAPI(esnRestangular) {
    return {
      search: search
    };

    function search(query, objectTypes, limit) {
      return esnRestangular.all('people/search').customPOST({
        q: query,
        objectTypes: objectTypes || [],
        limit: limit
      }).then(function(result) {
        return result.data;
      });
    }
  }

})(angular);

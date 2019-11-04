(function(angular) {
  'use strict';

  angular.module('esn.people').factory('esnPeopleAPI', esnPeopleAPI);

  function esnPeopleAPI(esnRestangular) {
    return {
      resolve: resolve,
      search: search
    };

    function search(query, objectTypes, limit, excludes) {
      return esnRestangular.all('people/search').customPOST({
        q: query,
        objectTypes: objectTypes || [],
        limit: limit,
        excludes: excludes
      }).then(function(result) {
        return result.data;
      });
    }

    function resolve(fieldType, value, options) {
      options = options || {};
      var objectTypes = (options.objectTypes && options.objectTypes.length) ?
        options.objectTypes.join(',') :
        null;

      return esnRestangular.all('people/resolve').one(fieldType).one(value).get({ objectTypes: objectTypes })
        .then(function(result) {
          return result.data;
        });
    }
  }

})(angular);

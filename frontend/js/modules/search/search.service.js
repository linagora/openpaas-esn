(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchService', esnSearchService);

  function esnSearchService($state) {
    return {
      search: search
    };

    function search(query, provider) {
      var context = { reload: true };

      if ($state.current.name === 'search.main') {
        // So that moving next/previous does not mess with the "Back" button
        context.location = 'replace';
      }

      $state.go('search.main', {
        q: query.text,
        //query: query,
        // TODO: `a` is for 'advanced'
        // a: query,
        p: provider && provider.uid
      }, context);
    }
  }
})(angular);

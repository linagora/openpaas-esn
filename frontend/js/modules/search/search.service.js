(function(angular) {
  'use strict';

  angular.module('esn.search').factory('ESNSearchService', ESNSearchService);

  function ESNSearchService($state) {
    return {
      search: search
    };

    function search(query, providers) {
      var context = { reload: true };

      if ($state.current.name === 'search.main') {
        // So that moving next/previous does not mess with the "Back" button
        context.location = 'replace';
      }

      $state.go('search.main', { query: query, providers: providers }, context);
    }
  }
})(angular);

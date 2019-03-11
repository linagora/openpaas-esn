(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchService', esnSearchService);

  function esnSearchService(_, $state) {
    return {
      search: search
    };

    function search(query, provider) {
      query = cleanupSearchQuery(query, provider);

      var context = { reload: true };
      var stateParams = {
        // 'a' = 'A'dvanced query
        a: query.advanced
      };

      // if the search is advanced one, do not set anything in the simple search text
      // this field will be populated when we will have a parser
      stateParams.q = _.isEmpty(query.advanced) ? query.text : '';
      stateParams.p = provider && provider.uid;

      if (!provider || !provider.uid) {
        // For global search remove the advanced search which is not available globally for now
        stateParams.a = null;
      }

      if ($state.current.name === 'search.main') {
        // So that moving next/previous does not mess with the "Back" button
        context.location = 'replace';
      }

      if (provider && _.isFunction(provider.onSubmit)) {
        provider.onSubmit(query, stateParams, context);
      } else {
        $state.go('search.main', stateParams, context);
      }
    }

    function cleanupSearchQuery(query, provider) {
      return provider && _.isFunction(provider.cleanQuery) ? provider.cleanQuery(query) : query;
    }
  }
})(angular);

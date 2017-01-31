(function() {
  'use strict';

  angular.module('esn.pagination')
    .factory('esnPaginationtionProviderBuilder', esnPaginationtionProviderBuilder);

  function esnPaginationtionProviderBuilder(esnPaginationProvider, infiniteScrollHelper, PageAggregatorService, _) {
    return function(scope, name, paginable, options) {
      var aggregator;
      var provider = new esnPaginationProvider(paginable, options);

      scope.loadMoreElements = infiniteScrollHelper(scope, function() {
        if (aggregator) {
          return load();
        }

        aggregator = new PageAggregatorService(name, [provider], {
          compare: options.compare || defaultCompare,
          results_per_page: options.limit
        });

        return load();
      });

      function defaultCompare(a, b) {
        return b.timestamps.creation - a.timestamps.creation;
      }

      function load() {
        return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
      }
    };
  }
})();

(function() {
  'use strict';

  angular.module('esn.pagination')
    .factory('esnPaginationtionProviderBuilder', esnPaginationtionProviderBuilder);

  function esnPaginationtionProviderBuilder(esnPaginationProvider, infiniteScrollHelper, PageAggregatorService, _) {
    return function(scope, name, sources, options) {
      var aggregator;
      var providers = [];

      sources = Array.isArray(sources) ? sources : [sources];

      sources.forEach(function(source) {
        providers.push(new esnPaginationProvider(source, options));
      });

      scope.loadMoreElements = infiniteScrollHelper(scope, function() {
        if (aggregator) {
          return load();
        }

        aggregator = new PageAggregatorService(name, providers, {
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

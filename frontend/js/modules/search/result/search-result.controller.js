(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchResultController', ESNSearchResultController);

  function ESNSearchResultController(
    _,
    $stateParams,
    $q,
    searchProviders,
    infiniteScrollHelper,
    PageAggregatorService,
    ELEMENTS_PER_PAGE
  ) {

    var self = this;
    var aggregator;

    self.$onInit = $onInit;

    function $onInit() {
      self.text = $stateParams.q;
      //self.query = $stateParams.query && $stateParams.query.text ? $stateParams.query.text : $stateParams.q;
      // TODO: Should be able to query from complex objects
      self.query = self.text;

      self.load = function() {
        return aggregator.loadNextItems().then(_.property('data'));
      };

      self.loadMoreElements = infiniteScrollHelper(self, function() {
        if (!self.query) {
          return $q.when([]);
        }

        if (aggregator) {
          return self.load();
        }

        return buildSearchOptions()
          .then(function(options) {
            return searchProviders.getAll(options);
          })
          .then(function(providers) {
            aggregator = new PageAggregatorService('searchResultControllerAggregator', providers, {
              compare: function(a, b) { return b.date - a.date; },
              results_per_page: ELEMENTS_PER_PAGE
            });

            return self.load();
          });
      });

      function buildSearchOptions() {
        return searchProviders.getAllProviderDefinitions().then(function(providers) {
          var options = {};
          var provider = _.find(providers, { uid: $stateParams.p });

          // TODO: replace query.text by query
          // providers must be updated to accept query as string or query as object with text in it
          self.query && (options.query = self.query);

          options.acceptedIds = provider ? [provider.id] : providers.map(_.property('id'));

          return options;
        });
      }
    }
  }
})(angular);

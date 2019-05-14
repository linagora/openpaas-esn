(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchResultController', ESNSearchResultController);

  function ESNSearchResultController(
    _,
    $stateParams,
    $q,
    searchProviders,
    esnSearchQueryService,
    infiniteScrollHelper,
    PageAggregatorService,
    ELEMENTS_PER_PAGE
  ) {

    var self = this;
    var aggregator;

    self.$onInit = $onInit;

    function $onInit() {
      self.query = esnSearchQueryService.buildFromState($stateParams);
      self.queryText = self.query.advanced.contains || self.query.text;

      self.providerUid = $stateParams.p;

      self.load = function() {
        return aggregator.loadNextItems().then(_.property('data'));
      };

      self.loadMoreElements = infiniteScrollHelper(self, function() {
        if (esnSearchQueryService.isEmpty(self.query)) {
          return $q.when([]);
        }

        if (aggregator) {
          return self.load();
        }

        return buildSearchOptions(self.query, self.providerUid)
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

      function buildSearchOptions(query, providerUid) {
        return searchProviders.getAllProviderDefinitions().then(function(providers) {
          var options = {};
          var provider = _.find(providers, { uid: providerUid });

          options.query = query;
          options.acceptedIds = provider ? [provider.id] : providers.map(_.property('id'));

          return options;
        });
      }
    }
  }
})(angular);

(function(angular) {
  'use strict';

  angular.module('esn.search').controller('searchResultController', searchResultController);

  function searchResultController(
    $scope,
    $stateParams,
    $q,
    searchProviders,
    infiniteScrollHelper,
    _,
    PageAggregatorService,
    ELEMENTS_PER_PAGE
  ) {

    var self = this;
    var aggregator;

    self.$onInit = $onInit;

    function $onInit() {
      var options = {};

      self.query = $stateParams.query.text || $stateParams.query;
      self.providers = $stateParams.providers;

      // TODO: replace query.text by query
      // providers must be updated to accept query as string or query as object with text in it
      self.query && (options.query = self.query);
      self.providers && (options.acceptedIds = self.providers.map(_.property('id')));

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

        return searchProviders.getAll(options)
          .then(function(providers) {
            aggregator = new PageAggregatorService('searchResultControllerAggregator', providers, {
              compare: function(a, b) { return b.date - a.date; },
              results_per_page: ELEMENTS_PER_PAGE
            });

            return self.load();
          });
      });
    }
  }
})(angular);

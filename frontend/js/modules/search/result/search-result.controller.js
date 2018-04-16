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

  var aggregator;
  var options = {};

  $scope.query = $stateParams.q;
  $scope.filters = $stateParams.filters;

  $scope.query && (options.query = $scope.query);
  $scope.filters && (options.acceptedIds = _.filter($scope.filters, { checked: true }).map(_.property('id')));

  function load() {
    return aggregator.loadNextItems().then(_.property('data'));
  }

  $scope.loadMoreElements = infiniteScrollHelper($scope, function() {
    if (!$scope.query) {
      return $q.when([]);
    }

    if (aggregator) {
      return load();
    }

    return searchProviders.getAll(options)
      .then(function(providers) {
        aggregator = new PageAggregatorService('searchResultControllerAggregator', providers, {
          compare: function(a, b) { return b.date - a.date; },
          results_per_page: ELEMENTS_PER_PAGE
        });

        return load();
      });
    });
  }

})(angular);

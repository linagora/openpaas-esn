'use strict';

angular.module('esn.search', ['esn.application-menu', 'esn.lodash-wrapper', 'esn.aggregator', 'esn.provider', 'op.dynamicDirective', 'angularMoment', 'esn.i18n'])
  .constant('SIGNIFICANT_DIGITS', 3)
  .constant('defaultSpinnerConfiguration', {
    spinnerKey: 'spinnerDefault',
    spinnerConf: {lines: 17, length: 15, width: 7, radius: 33, corners: 1, rotate: 0, direction: 1, color: '#555', speed: 1, trail: 60, shadow: false, hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto', left: 'auto'}
  })
  .directive('applicationMenuSearch', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/search', { name: 'search' }, 'Search')
    };
  })
  .directive('searchForm', function(defaultSpinnerConfiguration) {
    return {
      restrict: 'E',
      controller: function($scope) {
        $scope.spinnerKey = angular.isDefined($scope.spinnerKey) ? $scope.spinnerKey : defaultSpinnerConfiguration.spinnerKey;
        $scope.spinnerConf = angular.isDefined($scope.spinnerConf) ? $scope.spinnerConf : defaultSpinnerConfiguration.spinnerConf;
      },
      templateUrl: '/views/modules/search/search-form.html'
    };
  })
  .directive('searchHeaderForm', function() {
    return {
      restrict: 'E',
      scope: true,
      controller: function($scope, $state, $stateParams) {
        $scope.searchInput = $stateParams.q;
        $scope.search = function($event) {
          $event.preventDefault();
          $state.go('search.main', { q: $scope.searchInput, filters: $stateParams.filters }, { reload: true });
        };
      },
      templateUrl: '/views/modules/search/search-header-form.html'
    };
  })
  .directive('searchSubHeader', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/search/search-sub-header.html'
    };
  })
  .factory('searchResultSizeFormatter', function(SIGNIFICANT_DIGITS) {
    return function(count) {

      if (!count) {
        return {
          hits: 0,
          isFormatted: false
        };
      }

      var searchResultFormattingLimit = Math.pow(10, SIGNIFICANT_DIGITS);

      if (count < searchResultFormattingLimit) {
        return {
          hits: count,
          isFormatted: false
        };
      }

      var len = Math.ceil(Math.log(count + 1) / Math.LN10);

      return {
        hits: Math.round(count * Math.pow(10, -(len - SIGNIFICANT_DIGITS))) * Math.pow(10, len - SIGNIFICANT_DIGITS),
        isFormatted: true
      };
    };
  })
  .factory('searchProviders', function(Providers) {
    return new Providers();
  })
  .controller('searchSidebarController', function($scope, searchProviders, $stateParams, $state, _) {
    $scope.filters = $stateParams.filters;
    $scope.all = _getAllStatus();

    function _getAllStatus() {
      return !_.findKey($scope.filters, { checked: false });
    }

    if (!$scope.filters) {
      searchProviders.getAllProviderDefinitions().then(function(providers) {
        $scope.filters = providers.map(function(provider) {
          return {
            id: provider.id,
            name: provider.name,
            checked: true
          };
        });
      });
    }

    $scope.toggleAll = function() {
      _.forEach($scope.filters, function(filter) {
        filter.checked = $scope.all;
      });

      $scope.updateFilters();
    };

    $scope.updateFilters = function() {
      $scope.all = _getAllStatus();
      $state.go('search.main', { q: $stateParams.q, filters: $scope.filters }, { reload: true });
    };
  })
  .controller('searchResultController', function($scope, $stateParams, $q, searchProviders, infiniteScrollHelper, _,
                                                 PageAggregatorService, ELEMENTS_PER_PAGE) {
    var aggregator,
        options = {};

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
  });

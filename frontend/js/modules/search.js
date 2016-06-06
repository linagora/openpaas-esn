'use strict';

angular.module('esn.search', ['esn.application-menu', 'esn.lodash-wrapper', 'esn.aggregator', 'esn.provider', 'op.dynamicDirective', 'angularMoment'])
  .constant('SIGNIFICANT_DIGITS', 3)
  .constant('defaultSpinnerConfiguration', {
    spinnerKey: 'spinnerDefault',
    spinnerConf: {lines: 17, length: 15, width: 7, radius: 33, corners: 1, rotate: 0, direction: 1, color: '#555', speed: 1, trail: 60, shadow: false, hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto', left: 'auto'}
  })
  .config(function(dynamicDirectiveServiceProvider) {
    var search = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-search', {priority: 34}); // after 35 of contact

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', search);
  })
  .directive('applicationMenuSearch', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/search', 'mdi-magnify', 'Search')
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
  .directive('searchHeaderForm', function(defaultSpinnerConfiguration) {
    return {
      restrict: 'E',
      scope: true,
      controller: function($scope, $location) {
        $scope.searchInput = $location.search().q;
        $scope.search = function($event) {
          $event.preventDefault();
          $location.search('q', $scope.searchInput);
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
  .directive('searchHeader', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/search/header.html'
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
  .controller('searchSidebarController', function($scope, searchProviders) {
    searchProviders.getAllProviderNames().then(function(names) {
      $scope.filters = ['All'].concat(names);
    });
  })
  .controller('searchResultController', function($scope, $stateParams, searchProviders, infiniteScrollHelper, _) {
    $scope.query = $stateParams.q;
    searchProviders.getAll({ query: $scope.query }).then(function(providers) {
      $scope.groupedElements = providers.map(function(provider) {
        var groupSearch = {
          name: provider.name
        };

        groupSearch.loadMoreElements = infiniteScrollHelper(groupSearch, function() {
          return provider.loadNextItems().then(_.property('data'));
        });

        groupSearch.loadMoreElements();

        return groupSearch;
      });
    });
  });

'use strict';

angular.module('esn.infinite-list', ['infinite-scroll'])

  .constant('defaultConfiguration', {
    scrollDistance: 1,
    scrollDisabled: false,
    scrollImmediateCheck: 'true',
    throttle: 1000
  })

  .config(function($provide, defaultConfiguration) {
    $provide.value('THROTTLE_MILLISECONDS', defaultConfiguration.throttle);
  })

  .directive('infiniteList', function(defaultConfiguration) {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        loadMoreElements: '&',
        infiniteScrollDistance: '=?',
        infiniteScrollDisabled: '=?',
        infiniteScrollImmediateCheck: '=?',
        scrollInsideContainer: '=?',
        elementSelector: '@'
      },
      controller: function($scope, $element) {
        this.getElementsCount = function() {
          if (!$scope.elementSelector) {
            return 0;
          }

          return $element.find($scope.elementSelector).length;
        };
      },
      controllerAs: 'infiniteList',
      compile: function() {
        return {
          pre: function(scope, element) {
            scope.infiniteScrollDistance = angular.isDefined(scope.infiniteScrollDistance) ? scope.infiniteScrollDistance : defaultConfiguration.scrollDistance;
            scope.infiniteScrollDisabled = angular.isDefined(scope.infiniteScrollDisabled) ? scope.infiniteScrollDisabled : defaultConfiguration.scrollDisabled;
            scope.infiniteScrollImmediateCheck = angular.isDefined(scope.infiniteScrollImmediateCheck) ? scope.infiniteScrollImmediateCheck : defaultConfiguration.scrollImmediateCheck;
            scope.infiniteScrollContainer = scope.scrollInsideContainer ? element.parent() : null;
            scope.marker = 'test';
          },
          post: angular.noop
        };
      },
      templateUrl: '/views/modules/infinite-list/infinite-list.html'
    };
  });

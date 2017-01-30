(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .directive('infiniteList', infiniteList);

    function infiniteList(INFINITE_LIST_EVENTS, INFINITE_LIST_IMMEDIATE_CHECK, INFINITE_LIST_DISTANCE, INFINITE_LIST_DISABLED) {
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
        controller: controller,
        controllerAs: 'infiniteList',
        compile: compile,
        templateUrl: '/views/modules/infinite-list/infinite-list.html'
      };

      function compile() {
        return {
          pre: function(scope, element) {
            scope.infiniteScrollDistance = angular.isDefined(scope.infiniteScrollDistance) ? scope.infiniteScrollDistance : INFINITE_LIST_DISTANCE;
            scope.infiniteScrollDisabled = angular.isDefined(scope.infiniteScrollDisabled) ? scope.infiniteScrollDisabled : INFINITE_LIST_DISABLED;
            scope.infiniteScrollImmediateCheck = angular.isDefined(scope.infiniteScrollImmediateCheck) ? scope.infiniteScrollImmediateCheck : INFINITE_LIST_IMMEDIATE_CHECK;
            scope.infiniteScrollContainer = scope.scrollInsideContainer ? element.parent() : null;
            scope.infiniteScrollListenForEvent = INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS;
            scope.marker = 'test';
          },
          post: angular.noop
        };
      }

      function controller($scope, $element) {
        this.getElementsCount = function() {
          if (!$scope.elementSelector) {
            return 0;
          }

          return $element.find($scope.elementSelector).length;
        };
      }
    }
  })();

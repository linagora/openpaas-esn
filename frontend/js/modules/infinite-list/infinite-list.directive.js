(function() {
  'use strict';

  angular.module('esn.infinite-list')
    .directive('infiniteList', infiniteList);

    function infiniteList($interval, $q, MutationObserver, infiniteListService, INFINITE_LIST_EVENTS, INFINITE_LIST_IMMEDIATE_CHECK,
                          INFINITE_LIST_DISTANCE, INFINITE_LIST_DISABLED, INFINITE_LIST_POLLING_INTERVAL) {
      return {
        restrict: 'E',
        transclude: true,
        scope: {
          loadMoreElements: '&',
          loadRecentItems: '=?',
          infiniteScrollDistance: '=?',
          infiniteScrollDisabled: '=?',
          infiniteScrollImmediateCheck: '=?',
          scrollInsideContainer: '=?',
          elementSelector: '@'
        },
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
          post: function(scope, element) {
            // We only start the MutationObserver if we're asked to monitor child elements
            // through the use of the elementSelector attribute.
            if (scope.elementSelector) {
              var observer = new MutationObserver(function() {
                scope.$applyAsync(function(scope) {
                  scope.isEmpty = element.find(scope.elementSelector).length === 0;
                });
              });

              observer.observe(element[0], { childList: true, subtree: true });

              scope.$on('$destroy', function() {
                observer.disconnect();
              });
            }

            if (INFINITE_LIST_POLLING_INTERVAL > 0 && scope.loadRecentItems) {
              var poller = $interval(function() {
                $q.when(scope.loadRecentItems()).then(function(elements) {
                  if (elements && elements.length > 0) {
                    infiniteListService.addElements(elements);
                  }
                });
              }, INFINITE_LIST_POLLING_INTERVAL);

              scope.$on('$destroy', function() {
                $interval.cancel(poller);
              });
            }
          }
        };
      }
    }
  })();

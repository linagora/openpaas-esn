'use strict';

angular.module('esn.infinite-list', ['infinite-scroll'])

  .constant('INFINITE_LIST_EVENTS', {
    LOAD_MORE_ELEMENTS: 'infiniteList:loadMoreElements',
    REMOVE_ELEMENT: 'infiniteList:removeElement',
    ADD_ELEMENT: 'infiniteList:addElement'
  })

  .constant('defaultConfiguration', {
    scrollDistance: 0.5,
    scrollDisabled: false,
    scrollImmediateCheck: 'true',
    throttle: 10
  })

  .config(function($provide, defaultConfiguration) {
    $provide.value('THROTTLE_MILLISECONDS', defaultConfiguration.throttle);
  })

  .factory('infiniteListService', function($rootScope, INFINITE_LIST_EVENTS) {
    function _broadcast(event, element) {
      $rootScope.$broadcast(INFINITE_LIST_EVENTS[event], element);
    }

    return {
      loadMoreElements: _broadcast.bind(null, 'LOAD_MORE_ELEMENTS'),
      addElement: _broadcast.bind(null, 'ADD_ELEMENT'),
      removeElement: _broadcast.bind(null, 'REMOVE_ELEMENT')
    };
  })

  .directive('infiniteList', function(defaultConfiguration, INFINITE_LIST_EVENTS) {
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
            scope.infiniteScrollListenForEvent = INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS;
            scope.marker = 'test';
          },
          post: angular.noop
        };
      },
      templateUrl: '/views/modules/infinite-list/infinite-list.html'
    };
  });

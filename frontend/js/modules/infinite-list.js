'use strict';

angular.module('esn.infinite-list', ['infinite-scroll'])
  .constant('defaultConfiguration', {
    scrollDistance: '1',
    scrollDisabled: 'false',
    scrollImmediateCheck: 'true'
  })
  .directive('infiniteList', function(defaultConfiguration) {
    return {
      restrict: 'E',
      transclude: true,
      controller: function($scope) {
        //default values for the infinite list attribute configuration
        $scope.infiniteScrollDistance = angular.isDefined($scope.infiniteScrollDistance) ? $scope.infiniteScrollDistance : defaultConfiguration.scrollDistance;
        $scope.infiniteScrollDisabled = angular.isDefined($scope.infiniteScrollDisabled) ? $scope.infiniteScrollDisabled : defaultConfiguration.scrollDisabled;
        $scope.infiniteScrollImmediateCheck = angular.isDefined($scope.infiniteScrollImmediateCheck) ? $scope.infiniteScrollImmediateCheck : defaultConfiguration.scrollImmediateCheck;
      },
      templateUrl: '/views/infinite-list/partials/infinite-list.html'
    };
  });

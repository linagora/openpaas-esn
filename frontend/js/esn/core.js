'use strict';

angular.module('esn.core', [])
  .controller('selectActiveItem', ['$scope', function($scope) {
    $scope.selected = 1;
    $scope.selectItem = function(index) {
      $scope.selected = index;
    };
  }]);

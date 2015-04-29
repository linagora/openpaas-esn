'use strict';

angular.module('linagora.esn.contact')
  .controller('contactController', ['$scope',
    function($scope) {
      $scope.streams = [];
      $scope.getAll = function() {
        $scope.selected = 'all';
        $scope.loading = false;
      };
      $scope.getAll();
    }]);

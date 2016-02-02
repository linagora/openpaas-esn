'use strict';

angular.module('esn.calendar')
  .controller('eventFullFormController', function($scope, event) {
    if (event) {
      $scope.event = event;
    }
  });

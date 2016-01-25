'use strict';

angular.module('esn.calendar')
  .controller('calendarsEditionController', function($scope, $log, $state, headerService, calendars) {
    headerService.subHeader.addInjection('calendars-edition-header', $scope);

    $scope.calendars = calendars;

    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });

    $scope.modify = function(cal) {
      $state.go('calendar.edit', {id: cal.id});
    };

    $scope.add = function(cal) {
      $state.go('calendar.add');
    };

    $scope.cancel = function() {
      $state.go('calendar.main');
    };
  })
  .directive('calendarsEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendars-edit-header.html'
    };
  });

'use strict';

angular.module('esn.calendar')
  .controller('calendarsEditionController', function($scope, $state) {

    $scope.calendars = $scope.calendars || [];

    $scope.modify = function(calendar) {
      $state.go('calendar.edit', {calendarId: calendar.id});
    };

    $scope.add = function() {
      $state.go('calendar.add');
    };

    $scope.cancel = function() {
      $state.go('calendar.main');
    };
  })
  .directive('calendarsEdit', function() {
    return {
      restrict: 'E',
      scope: {
        calendars: '='
      },
      templateUrl: 'calendar/views/calendar-configuration/calendars-edit',
      controller: 'calendarsEditionController'
    };
  })
  .directive('calendarsEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendars-edit-header.html'
    };
  });

'use strict';

angular.module('esn.calendar')
  .controller('calendarEditionController', function($scope, $log, $location, calendar, calendarService, session, headerService) {
    headerService.subHeader.addInjection('calendar-edition-header', $scope);

    $scope.newCalendar = !calendar;

    $scope.calendar = calendar || {};

    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });

    $scope.submit = function() {
      $log.debug('To be done, submit');
    };

    $scope.delete = function() {
      if ($scope.newCalendar) {
        $log.error('Can\'t delete a new calendar');
      }

      $log.debug('To be done, delete');
    };

    $scope.cancel = function() {
      $log.debug('cancel');
      $location.path('/calendar');
    };
  })
  .directive('calendarEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit-header.html'
    };
  });

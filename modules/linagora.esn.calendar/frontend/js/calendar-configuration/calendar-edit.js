'use strict';

angular.module('esn.calendar')
  .controller('calendarEditionController', function($scope, $log, $location, uuid4, calendar, calendarService, CalendarCollectionShell, session, notificationFactory, headerService) {
    if (!calendarService.calendarHomeId) {
      $location.path('/calendar');
      return;
    }

    headerService.subHeader.addInjection('calendar-edition-header', $scope);
    $scope.newCalendar = !calendar;
    $scope.calendar = calendar || {};

    if ($scope.newCalendar) {
      $scope.calendar.href = CalendarCollectionShell.buildHref(calendarService.calendarHomeId, uuid4.generate());
      // Before a proper color-picker
      $scope.calendar.color = '#' + Math.random().toString(16).substr(-6);
    }

    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });

    $scope.submit = function() {
      if ($scope.newCalendar) {
        CalendarCollectionShell.from($scope.calendar);
        calendarService.createCalendar(calendarService.calendarHomeId, CalendarCollectionShell.from($scope.calendar))
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', $scope.calendar.name + ' has been created.');
            $location.path('/calendar');
          });
      } else {
        $log.debug('To be done, modify');
      }
    };

    $scope.delete = function() {
      if ($scope.newCalendar) {
        $log.error('Can\'t delete a new calendar');
      }

      $log.debug('To be done, delete');
    };

    $scope.cancel = function() {
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

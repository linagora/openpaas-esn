'use strict';

angular.module('esn.calendar')
  .controller('calendarEditionController', function($scope, $log, $location, uuid4, calendar, calendarService, CalendarCollectionShell, session, notificationFactory, headerService, CALENDAR_MODIFY_COMPARE_KEYS) {
    if (!calendarService.calendarHomeId) {
      $location.path('/calendar');
      return;
    }

    headerService.subHeader.addInjection('calendar-edition-header', $scope);
    $scope.newCalendar = !calendar;
    $scope.calendar = calendar || {};
    $scope.oldCalendar = {};
    angular.copy($scope.calendar, $scope.oldCalendar);

    if ($scope.newCalendar) {
      $scope.calendar.href = CalendarCollectionShell.buildHref(calendarService.calendarHomeId, uuid4.generate());
      // Before a proper color-picker
      $scope.calendar.color = '#' + Math.random().toString(16).substr(-6);
    }

    $scope.$on('$destroy', function() {
      headerService.resetAllInjections();
    });

    function canSaveCalendar() {
      return !!$scope.calendar.name && $scope.calendar.name.length > 1;
    }

    function hasModifications(oldCalendar, newCalendar) {
      return CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    $scope.submit = function() {
      if (!canSaveCalendar()) {
        return;
      }

      var shell = CalendarCollectionShell.from($scope.calendar);
      if ($scope.newCalendar) {
        calendarService.createCalendar(calendarService.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', $scope.calendar.name + ' has been created.');
            $location.path('/calendar');
          });
      } else {
        if (!hasModifications($scope.oldCalendar, $scope.calendar)) {
          $location.path('/calendar');
          return;
        }
        calendarService.modifyCalendar(calendarService.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', $scope.calendar.name + ' has been modified.');
            $location.path('/calendar');
          });
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

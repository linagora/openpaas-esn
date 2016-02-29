'use strict';

angular.module('esn.calendar')
  .controller('calendarEditionController', function($scope, $log, $state, $modal, uuid4, calendarService, CalendarCollectionShell, notificationFactory, headerService, CALENDAR_MODIFY_COMPARE_KEYS) {
    headerService.subHeader.addInjection('calendar-edition-header', $scope);

    $scope.newCalendar = !$scope.calendar;
    $scope.calendar = $scope.calendar || {};
    $scope.oldCalendar = {};
    angular.copy($scope.calendar, $scope.oldCalendar);

    if ($scope.newCalendar) {
      $scope.calendar.href = CalendarCollectionShell.buildHref($scope.calendarHomeId, uuid4.generate());
      $scope.calendar.color = '#' + Math.random().toString(16).substr(-6);
    }

    function canSaveCalendar() {
      return !!$scope.calendar.name && $scope.calendar.name.length >= 1;
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
        calendarService.createCalendar($scope.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', $scope.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        if (!hasModifications($scope.oldCalendar, $scope.calendar)) {
          $state.go('calendar.list');
          return;
        }
        calendarService.modifyCalendar($scope.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('Calendar - ', $scope.calendar.name + ' has been modified.');
            $state.go('calendar.main');
          });
      }
    };

    $scope.openDeleteConfirmationDialog = function() {
      $scope.modal = $modal({scope: $scope, templateUrl: '/calendar/views/calendar-configuration/calendar-edit-delete-confirmation.html', backdrop: 'static', placement: 'center'});
    };

    $scope.delete = function() {
      $log.debug('Delete calendar not implemented yet');
    };

    $scope.cancel = function() {
      $state.go('calendar.main');
    };

    $scope.cancelMobile = function() {
      $state.go('calendar.list');
    };
  })
  .directive('calendarEdit', function() {
    return {
      restrict: 'E',
      scope: {
        calendar: '=?',
        calendarHomeId: '='
      },
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit',
      controller: 'calendarEditionController'
    };
  })
  .directive('calendarEditionHeader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar-configuration/calendar-edit-header.html'
    };
  });

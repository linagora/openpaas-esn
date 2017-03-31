(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarConfigurationTabMainController', CalendarConfigurationTabMainController);

  function CalendarConfigurationTabMainController(
    $modal,
    $state,
    calendarService,
    CAL_CALENDAR_RIGHT,
    CAL_DEFAULT_CALENDAR_ID
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.openDeleteConfirmationDialog = openDeleteConfirmationDialog;
    self.removeCalendar = removeCalendar;
    self.canDeleteCalendar = canDeleteCalendar;

    ///////////
    function $onInit() {
      self.publicRights = [
        {
          value: CAL_CALENDAR_RIGHT.PUBLIC_READ,
          name: 'Read'
        },
        {
          value: CAL_CALENDAR_RIGHT.WRITE,
          name: 'Write'
        }, {
          value: CAL_CALENDAR_RIGHT.FREE_BUSY,
          name: 'Private'
        }, {
          value: CAL_CALENDAR_RIGHT.NONE,
          name: 'None'
        }
      ];
    }

    function openDeleteConfirmationDialog() {
      self.modal = $modal({
        templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-delete-confirmation/calendar-configuration-delete-confirmation.html',
        controller: function($scope) {
          $scope.calendarName = self.calendar.name;
          $scope.delete = removeCalendar;
        },
        backdrop: 'static',
        placement: 'center'
      });
    }

    function removeCalendar() {
      calendarService.removeCalendar(self.calendarHomeId, self.calendar).then(function() {
        $state.go('calendar.main');
      });
    }

    function canDeleteCalendar() {
      var isDefaultCalendar = self.calendar && (self.calendar.id === CAL_DEFAULT_CALENDAR_ID);

      return !self.newCalendar && !isDefaultCalendar;
    }
  }
})();

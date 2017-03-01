(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarsListController', CalendarsListController);

  function CalendarsListController(
    $rootScope,
    $scope,
    calendarService,
    calendarVisibilityService,
    session,
    CALENDAR_EVENTS
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.activate = activate;

    ////////////

    function $onInit() {
      self.calendars = [];
      self.hiddenCalendars = {};
      self.selectCalendar = selectCalendar;
      self.toggleCalendar = calendarVisibilityService.toggle;

      self.activate();
    }

    function activate() {
      listCalendars();
      getHiddenCalendars();

      var deregister = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
        self.hiddenCalendars[data.calendarId] = data.hidden;
      });

      $scope.$on('$destroy', deregister);
    }

    function selectCalendar(calendar) {
      self.calendars.forEach(function(cal) {
        cal.selected = calendar.id === cal.id;
      });

      self.hiddenCalendars[calendar.id] && self.toggleCalendar(calendar);
    }

    function listCalendars() {
      calendarService.listCalendars(session.user._id).then(function(calendars) {
        self.calendars = calendars;
      });
    }

    function getHiddenCalendars() {
      calendarVisibilityService.getHiddenCalendars().then(function(hiddenCalendars) {
        hiddenCalendars.forEach(function(calendarId) {
          self.hiddenCalendars[calendarId] = true;
        });
      });
    }
  }
})();

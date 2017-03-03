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
      self.arrangeCalendars = arrangeCalendars;

      self.activate();
    }

    function activate() {
      listCalendars();
      getHiddenCalendars();

      var destroyCalAddEvent = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.ADD, self.arrangeCalendars);

      var destroyCalRemoveEvent = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.REMOVE, self.arrangeCalendars);

      var deregister = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
        self.hiddenCalendars[data.calendarId] = data.hidden;
      });

      $scope.$on('$destroy', destroyCalAddEvent);
      $scope.$on('$destroy', destroyCalRemoveEvent);
      $scope.$on('$destroy', deregister);
    }

    function selectCalendar(calendar) {
      self.calendars.forEach(function(cal) {
        cal.selected = calendar.id === cal.id;
      });

      self.hiddenCalendars[calendar.id] && self.toggleCalendar(calendar);
    }

    function listCalendars() {
      var options = {
        withRights: true
      };

      calendarService.listCalendars(session.user._id, options).then(function(calendars) {
        self.calendars = calendars;

        self.arrangeCalendars();
      });
    }

    function getHiddenCalendars() {
      calendarVisibilityService.getHiddenCalendars().then(function(hiddenCalendars) {
        hiddenCalendars.forEach(function(calendarId) {
          self.hiddenCalendars[calendarId] = true;
        });
      });
    }

    function arrangeCalendars() {
      self.myCalendars = self.calendars.filter(function(calendar) {
        if (calendar.rights) {
          var rights = calendar.rights.getUserRight(session.user._id);

          return rights === 'admin';
        }

        return true;
      });

      self.sharedCalendars = self.calendars.filter(function(calendar) {
        if (calendar.rights) {
          var rights = calendar.rights.getUserRight(session.user._id);

          return rights !== 'admin';
        }

        return false;
      });
    }
  }
})();

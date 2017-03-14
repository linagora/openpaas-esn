(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarsListController', CalendarsListController);

  function CalendarsListController(
    $rootScope,
    $scope,
    $q,
    calendarService,
    calendarVisibilityService,
    session,
    userAndSharedCalendars,
    _,
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
      $q
        .all(listCalendars(), getHiddenCalendars())
        .then(function() {
          var destroyCalAddEvent = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.ADD, handleCalendarAdd);
          var destroyCalRemoveEvent = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.REMOVE, handleCalendarRemove);

          var deregister = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
            self.hiddenCalendars[data.calendarId] = data.hidden;
          });

          $scope.$on('$destroy', destroyCalAddEvent);
          $scope.$on('$destroy', destroyCalRemoveEvent);
          $scope.$on('$destroy', deregister);
        });
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

      return calendarService.listCalendars(session.user._id, options).then(function(calendars) {
        self.calendars = _.clone(calendars);

        refreshCalendarsList();
      });
    }

    function getHiddenCalendars() {
      return calendarVisibilityService.getHiddenCalendars().then(function(hiddenCalendars) {
        hiddenCalendars.forEach(function(calendarId) {
          self.hiddenCalendars[calendarId] = true;
        });
      });
    }

    function handleCalendarAdd(event, calendar) {
      self.calendars.push(calendar);
      refreshCalendarsList();
    }

    function handleCalendarRemove(event, calendar) {
      _.remove(self.calendars, { id: calendar.id });
      refreshCalendarsList();
    }

    function refreshCalendarsList() {
      var calendars = userAndSharedCalendars(self.calendars);

      self.userCalendars = calendars.userCalendars;
      self.sharedCalendars = calendars.sharedCalendars;
    }
  }
})();

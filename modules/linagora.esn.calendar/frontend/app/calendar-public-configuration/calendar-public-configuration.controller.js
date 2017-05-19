(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalCalendarPublicConfigurationController', CalCalendarPublicConfigurationController);

  function CalCalendarPublicConfigurationController($log, $q, $state, _, calendarService, calPublicCalendarStore) {
    var self = this;

    self.calendarsPerUser = [];
    self.selectedCalendars = [];
    self.users = [];
    self.getSelectedCalendars = getSelectedCalendars;
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribe = subscribe;

    function getPublicCalendarsForUser(user) {
      return calendarService.listAllCalendarsForUser(user._id).then(function(calendars) {
          return calendars.map(function(calendar) {
            return {
              user: user,
              calendar: calendar
            };
          });
        });
    }

    function getSelectedCalendars() {
      return _.chain(self.calendarsPerUser)
        .filter('isSelected')
        .map(function(selected) {
          return selected.calendar;
        })
        .value();
    }

    function onUserAdded(user) {
      if (!user) {
        return;
      }

      getPublicCalendarsForUser(user)
        .then(function(userCalendars) {
          userCalendars.forEach(function(userCalendar) {
            self.calendarsPerUser.push(userCalendar);
          });
        })
        .catch(function(err) {
          $log.error('Can not get public calendars for user', user._id, err);
        });
    }

    function onUserRemoved(user) {
      _.remove(self.calendarsPerUser, function(calendarPerUser) {
        return calendarPerUser.user._id === user._id;
      });
    }

    function subscribe() {
      var calendars = getSelectedCalendars();

      calendars.length && calPublicCalendarStore.storeAll(calendars);
    }
  }
})();

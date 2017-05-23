(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalCalendarPublicConfigurationController', CalCalendarPublicConfigurationController);

  function CalCalendarPublicConfigurationController($log, $q, $state, _, calendarService) {
    var self = this;

    self.calendarsPerUser = [];
    self.selectedCalendars = [];
    self.users = [];
    self.getSelectedCalendars = getSelectedCalendars;
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribeToSelectedCalendars = subscribeToSelectedCalendars;

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
          self.calendarsPerUser = self.calendarsPerUser.concat(userCalendars);
        })
        .catch(function(err) {
          $log.error('Can not get public calendars for user', user._id, err);
        });
    }

    function onUserRemoved(user) {
      if (!user) {
        return;
      }

      _.remove(self.calendarsPerUser, function(calendarPerUser) {
        return calendarPerUser.user._id === user._id;
      });
    }

    function subscribeToSelectedCalendars() {
      var selectedCalendars = getSelectedCalendars();

      selectedCalendars.length && console.log('chamerling will modify this YOLO');
    }
  }
})();

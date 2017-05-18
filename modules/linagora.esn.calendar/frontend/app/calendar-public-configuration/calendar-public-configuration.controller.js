(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarPublicConfigurationController', calendarPublicConfigurationController);

  function calendarPublicConfigurationController($log, $q, $state, _, calendarService) {
    var self = this;

    self.calendarsPerUser = [];
    self.selectedCalendars = [];
    self.users = [];
    self.getSelectedCalendars = getSelectedCalendars;
    self.onUserAdded = onUserAdded;
    self.onUserRemoved = onUserRemoved;
    self.subscribe = subscribe;

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
          $log.error('Can not get public calendars for user', err);
        });
    }

    function onUserRemoved(user) {
      _.remove(self.calendarsPerUser, function(calendarPerUser) {
        return calendarPerUser.user._id === user._id;
      });
    }

    function getSelectedCalendars() {
      return _.filter(self.calendarsPerUser, 'isSelected');
    }

    function subscribe() {
      $log.info('Will Subscribe to', getSelectedCalendars());
    }

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
  }
})();

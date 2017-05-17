(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarPublicConfigurationController', calendarPublicConfigurationController);

  function calendarPublicConfigurationController($log, $q, $state, calendarService, calPublicCalendarStore, notificationFactory) {
    var self = this;

    self.findPublicCalendars = findPublicCalendars;
    self.updateButtonDisplay = updateButtonDisplay;
    self.subscribe = subscribe;
    self.$onInit = $onInit;

    function $onInit() {
      self.users = [];
      self.selectedCalendars = [];
      self.disableButton = true;
    }

    function updateButtonDisplay() {
      self.disableButton = (self.users.length === 0);
    }

    function fetchPublicCalendars() {
      var promises = self.users.map(function(user) {
        return calendarService.listAllCalendarsForUser(user._id).then(function(calendars) {
          return {
            user: user,
            calendars: calendars
          };
        });
      });

      return $q.all(promises);
    }

    function subscribe() {
      calPublicCalendarStore.storeAll(self.selectedCalendars);
    }

    function findPublicCalendars() {
      if (self.users.length && !self.fetching) {
        self.fetching = true;
        fetchPublicCalendars()
          .then(function(result) {
            self.calendarsPerUser = result;
          })
          .catch(function(err) {
            $log.error('Error while getting public calendars for users', err);
          })
          .finally(function() {
            self.fetching = false;
          });
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarPublicConfigurationController', calendarPublicConfigurationController);

  function calendarPublicConfigurationController($log, $q, $state, _, calendarService) {
    var self = this;

    self.findPublicCalendars = findPublicCalendars;
    self.getSelectedCalendars = getSelectedCalendars;
    self.subscribe = subscribe;
    self.updateButtonDisplay = updateButtonDisplay;
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
          return calendars.map(function(calendar) {
            return {
              user: user,
              calendar: calendar
            };
          });
        });
      });

      return $q.all(promises);
    }

    function getSelectedCalendars() {
      return _.filter(self.calendarsPerUser, 'isSelected');
    }

    function subscribe() {
      $log.info('Will Subscribe to', getSelectedCalendars());
    }

    function findPublicCalendars() {
      if (self.users.length && !self.fetching) {
        self.fetching = true;
        fetchPublicCalendars()
          .then(function(result) {
            self.calendarsPerUser = _.flatten(result);
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

(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarPublicConfigurationController', calendarPublicConfigurationController);

  function calendarPublicConfigurationController($state, $log, calendarService, calPublicCalendarStore, notificationFactory) {
    var self = this;

    self.users = [];
    self.disableButton = true;

    self.updateButtonDisplay = updateButtonDisplay;
    self.addPublicCalendars = addPublicCalendars;

    ////////////

    function updateButtonDisplay() {
      self.disableButton = (self.users.length === 0);
    }

    function addPublicCalendars() {
      calendarService
        .listAllCalendarsForUser(_getUsersId())
        .then(
          function(calendars) {
            $state.go('calendar.main');
            calPublicCalendarStore.storeAll(calendars);
          },
          function(error) {
            $log.error(error);
            notificationFactory.weakError('Could not find public calendars.');
          });
    }

    function _getUsersId() {
      /**
       * we are dealing with tags-input which gives us an array of user.
       * Now, we are limiting addCalendars to only one cal by time.
       * This should be changed as soon as we support adding several public calendars at time.
       */
      return self.users[0]._id;
    }
  }
})();

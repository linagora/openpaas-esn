(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfiguration', calendarsConfiguration);

  function calendarsConfiguration() {
    var directive = {
      restrict: 'E',
      templateUrl: 'calendar/app/calendars-configuration/calendars-configuration.html',
      scope: {
        calendars: '='
      },
      replace: true,
      controller: CalendarsConfigurationController,
      controllerAs: '$ctrl',
      bindToController: true
    };

    return directive;
  }

  function CalendarsConfigurationController(userAndSharedCalendars) {
    var self = this;
    var calendars = userAndSharedCalendars(self.calendars);

    self.userCalendars = calendars.userCalendars;
    self.sharedCalendars = calendars.sharedCalendars;
  }

})();

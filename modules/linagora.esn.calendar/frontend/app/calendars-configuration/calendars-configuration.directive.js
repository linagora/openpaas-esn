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

  function CalendarsConfigurationController(userAndExternalCalendars) {
    var self = this;
    var calendars = userAndExternalCalendars(self.calendars);

    self.userCalendars = calendars.userCalendars;
    self.sharedCalendars = calendars.sharedCalendars;
  }

})();

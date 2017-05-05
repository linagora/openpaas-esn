(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfigurationMobile', calendarsConfigurationMobile);

  function calendarsConfigurationMobile() {
    var directive = {
      restrict: 'E',
      templateUrl: 'calendar/app/calendars-configuration-mobile/calendars-configuration-mobile.html',
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

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

  function CalendarsConfigurationController(session) {
    var self = this;

    arrangeCalendars(self.calendars);

    ////////////

    function arrangeCalendars(calendars) {
      self.userCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          var rights = calendar.rights.getUserRight(session.user._id);

          return rights === 'admin';
        }

        return true;
      });

      self.sharedCalendars = calendars.filter(function(calendar) {
        if (calendar.rights) {
          var rights = calendar.rights.getUserRight(session.user._id);

          return rights !== 'admin';
        }

        return false;
      });
    }
  }

})();

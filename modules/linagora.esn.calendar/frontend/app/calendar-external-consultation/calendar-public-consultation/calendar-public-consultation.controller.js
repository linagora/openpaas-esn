(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarPublicConsultationController', CalendarPublicConsultationController);

  function CalendarPublicConsultationController($stateParams, _, $log, calPublicCalendarStore) {
    var self = this;

    self.$onInit = $onInit;

    ////////////

    function $onInit() {
      if ($stateParams.calendarId) {
        var allPublicCalendars = calPublicCalendarStore.getAll();

        self.publicCalendar = _.find(allPublicCalendars, { id: $stateParams.calendarId });
        self.publicRight = self.publicCalendar.rights.getPublicRight();

        self.publicCalendar.getOwner().then(function(owner) {
          self.publicCalendarOwner = owner;
        });
      } else {
        $log.error('the calendar id is not found');
      }
    }
  }
})();

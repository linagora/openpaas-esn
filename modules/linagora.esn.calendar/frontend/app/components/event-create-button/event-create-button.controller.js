(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calEventCreateButtonController', calEventCreateButtonController);

  function calEventCreateButtonController(CalendarShell, calendarUtils, calOpenEventForm) {
    var self = this;

    self.openEventForm = openEventForm;

    ////////////

    function openEventForm() {
      calOpenEventForm(self.calendarHomeId, CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate()
      }));
    }
  }

})();

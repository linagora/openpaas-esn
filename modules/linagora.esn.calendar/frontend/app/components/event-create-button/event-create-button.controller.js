(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('eventCreateButtonController', eventCreateButtonController);

  function eventCreateButtonController(CalendarShell, calendarUtils, calOpenEventForm) {
    var self = this;

    self.openEventForm = _openEventForm;

    ////////////

    function _openEventForm() {
      calOpenEventForm(CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate()
      }));
    }
  }

})();

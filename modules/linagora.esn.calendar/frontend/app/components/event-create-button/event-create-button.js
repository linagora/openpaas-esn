(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventCreateButton', eventCreateButton);

  function eventCreateButton() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/event-create-button/event-create-button.html',
      scope: {
        community: '=',
        user: '='
      },
      replace: true,
      controller: EventCreateButtonController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  EventCreateButtonController.$inject = ['CalendarShell', 'calendarUtils', 'openEventForm'];

  function EventCreateButtonController(CalendarShell, calendarUtils, openEventForm) {
    var self = this;

    self.openEventForm = _openEventForm;

    ////////////

    function _openEventForm() {
      openEventForm(CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate()
      }));
    }
  }

})();

(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calAttendeeItemConsult', {
      templateUrl: '/calendar/app/components/attendee/attendee-item-consult/attendee-item-consult.html',
      bindings: {
        attendee: '=',
        isOrganizer: '<'
      },
      controllerAs: 'ctrl'
    });
})();

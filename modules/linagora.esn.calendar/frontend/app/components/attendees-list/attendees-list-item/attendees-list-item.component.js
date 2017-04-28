(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calAttendeesListItem', {
      templateUrl: '/calendar/app/components/attendees-list/attendees-list-item/attendees-list-item.html',
      bindings: {
        attendee: '=',
        canModifyAttendee: '<',
        isOrganizer: '<'
      },
      controllerAs: 'ctrl'
    });
})();

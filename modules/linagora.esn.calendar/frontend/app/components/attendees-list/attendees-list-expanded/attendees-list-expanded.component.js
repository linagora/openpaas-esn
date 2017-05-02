(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calAttendeesListExpanded', {
      bindings: {
        attendees: '=',
        canModifyAttendees: '=',
        organizer: '='
      },
      controller: 'CalAttendeesListController',
      controllerAs: 'ctrl',
      templateUrl: '/calendar/app/components/attendees-list/attendees-list-expanded/attendees-list-expanded.html'
    });
})();

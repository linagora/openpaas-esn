(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calAttendeesList', {
      bindings: {
        attendees: '=',
        canModifyAttendees: '=',
        organizer: '='
      },
      controller: 'CalAttendeesListController',
      controllerAs: 'ctrl',
      templateUrl: '/calendar/app/components/attendees-list/attendees-list.html'
    });
})();

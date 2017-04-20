'use strict';

angular.module('esn.calendar')
  .component('calAttendeeListItemConsult', {
    templateUrl: '/calendar/app/components/attendee-list-item-consult/attendee-list-item-consult.html',
    bindings: {
      attendee: '=',
      isOrganizer: '<'
    },
    controllerAs: 'ctrl'
  });

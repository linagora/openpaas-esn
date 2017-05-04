'use strict';

angular.module('esn.calendar')
  .component('calAttendeeItemEdition', {
    templateUrl: '/calendar/app/components/attendee/attendee-item-edition/attendee-item-edition.html',
    bindings: {
      attendee: '=',
      canModifyAttendee: '=',
      isOrganizer: '='
    },
    controllerAs: 'ctrl'
  });

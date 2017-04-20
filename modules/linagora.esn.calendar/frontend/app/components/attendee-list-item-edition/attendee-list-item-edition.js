'use strict';

angular.module('esn.calendar')
  .component('calAttendeeListItemEdition', {
    templateUrl: '/calendar/app/components/attendee-list-item-edition/attendee-list-item-edition.html',
    bindings: {
      attendee: '=',
      canModifyAttendee: '=',
      isOrganizer: '='
    },
    controllerAs: 'ctrl'
  });

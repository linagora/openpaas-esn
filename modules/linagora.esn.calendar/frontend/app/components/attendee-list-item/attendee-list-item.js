'use strict';

angular.module('esn.calendar')
  .component('calAttendeeListItem', {
    templateUrl: '/calendar/app/components/attendee-list-item/attendee-list-item.html',
    bindings: {
      attendee: '=',
      readOnly: '=',
      isOrganizer: '=',
      mode: '='
    },
    controllerAs: 'ctrl'
  });

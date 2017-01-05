'use strict';

angular.module('esn.calendar')

  .component('calMailToAttendees', {
    templateUrl: '/calendar/app/components/mail-to-attendees/mail-to-attendees.html',
    controller: 'calMailToAttendeesController',
    controllerAs: 'ctrl',
    bindings: {
      event: '='
    }
  });

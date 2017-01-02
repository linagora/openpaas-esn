'use strict';

angular.module('esn.calendar')

  .component('mailToAttendees', {
    templateUrl: '/calendar/app/components/mail-to-attendees/mail-to-attendees.html',
    controller: 'mailToAttendeesController',
    controllerAs: 'ctrl',
    bindings: {
      event: '='
    }
  });

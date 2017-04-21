(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calEventMessageEdition', {
      bindings: {
        activitystream: '<',
        calendarHomeId: '<'
      },
      controller: 'CalEventMessageEditionController',
      templateUrl: '/calendar/app/event-message/event-message-edition/event-message-edition.html'
   });
})();

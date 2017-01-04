'use strict';

angular.module('esn.calendar')
  .component('eventAlarmEdition', {
    templateUrl: '/calendar/app/components/event-alarm-edition/event-alarm-edition.html',
    bindings: {
      event: '='
    },
    controller: 'eventAlarmEditionController',
    controllerAs: 'ctrl'
  });

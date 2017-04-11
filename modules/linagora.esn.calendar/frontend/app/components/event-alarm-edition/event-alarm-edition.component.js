'use strict';

angular.module('esn.calendar')
  .component('calEventAlarmEdition', {
    templateUrl: '/calendar/app/components/event-alarm-edition/event-alarm-edition.html',
    bindings: {
      event: '=',
      canModifyEvent: '=?'
    },
    controller: 'calEventAlarmEditionController',
    controllerAs: 'ctrl'
  });

'use strict';

angular.module('esn.calendar')
  .component('eventAlarmConsultation', {
    templateUrl: '/calendar/app/components/event-alarm-consultation/event-alarm-consultation.html',
    bindings: {
      event: '='
    },
    controller: 'eventAlarmConsultationController',
    controllerAs: 'ctrl'
  });

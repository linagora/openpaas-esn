'use strict';

angular.module('esn.calendar')
  .component('calEventAlarmConsultation', {
    templateUrl: '/calendar/app/components/event-alarm-consultation/event-alarm-consultation.html',
    bindings: {
      event: '='
    },
    controller: 'calEventAlarmConsultationController',
    controllerAs: 'ctrl'
  });

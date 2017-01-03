'use strict';

angular.module('esn.calendar')
  .component('eventDateConsultation', {
    templateUrl: '/calendar/app/components/event-date-consultation/event-date-consultation.html',
    controller: 'eventDateConsultationController',
    controllerAs: 'ctrl',
    bindings: {
      event: '='
    }
  });

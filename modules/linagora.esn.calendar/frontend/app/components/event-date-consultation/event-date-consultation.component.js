'use strict';

angular.module('esn.calendar')
  .component('calEventDateConsultation', {
    templateUrl: '/calendar/app/components/event-date-consultation/event-date-consultation.html',
    controller: 'calEventDateConsultationController',
    controllerAs: 'ctrl',
    bindings: {
      event: '='
    }
  });

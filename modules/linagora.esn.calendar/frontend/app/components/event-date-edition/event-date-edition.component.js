'use strict';

angular.module('esn.calendar')
  .component('eventDateEdition', {
    templateUrl: '/calendar/app/components/event-date-edition/event-date-edition.html',
    controller: 'eventDateEditionController',
    controllerAs: 'ctrl',
    bindings: {
      event: '=',
      disabled: '=?',
      dateOnBlur: '=?',
      allDayOnChange: '=?'
    }
  });

'use strict';

angular.module('esn.calendar')
  .component('calEventDateEdition', {
    templateUrl: '/calendar/app/components/event-date-edition/event-date-edition.html',
    controller: 'calEventDateEditionController',
    controllerAs: 'ctrl',
    bindings: {
      event: '=',
      disabled: '=?',
      dateOnBlur: '=?',
      allDayOnChange: '=?'
    }
  });

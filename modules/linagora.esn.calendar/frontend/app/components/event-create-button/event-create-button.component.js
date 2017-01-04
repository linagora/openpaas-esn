'use strict';

angular.module('esn.calendar')
  .component('eventCreateButton', {
    templateUrl: '/calendar/app/components/event-create-button/event-create-button.html',
    bindings: {
      community: '=',
      user: '='
    },
    controller: 'eventCreateButtonController',
    controllerAs: 'ctrl'
  });

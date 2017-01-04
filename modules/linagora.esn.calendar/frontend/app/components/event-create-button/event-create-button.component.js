'use strict';

angular.module('esn.calendar')
  .component('calEventCreateButton', {
    templateUrl: '/calendar/app/components/event-create-button/event-create-button.html',
    bindings: {
      community: '=',
      user: '='
    },
    controller: 'calEventCreateButtonController',
    controllerAs: 'ctrl'
  });

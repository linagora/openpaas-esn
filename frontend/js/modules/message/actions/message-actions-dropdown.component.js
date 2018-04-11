(function() {
  'use strict';

  angular.module('esn.message').component('messageActionsDropdown', {
    bindings: {
      message: '=',
      activitystream: '='
    },
    controller: 'messageActionsController',
    controllerAs: 'ctrl',
    templateUrl: '/views/modules/message/actions/message-actions-dropdown.html'
  });

})(angular);

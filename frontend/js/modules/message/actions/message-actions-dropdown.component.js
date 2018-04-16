(function() {
  'use strict';

  angular.module('esn.message').component('messageActionsDropdown', {
    bindings: {
      message: '=',
      activitystream: '=',
      parent: '=?'
    },
    controller: 'messageActionsController',
    controllerAs: 'ctrl',
    templateUrl: '/views/modules/message/actions/message-actions-dropdown.html'
  });

})(angular);

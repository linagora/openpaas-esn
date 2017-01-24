(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembershipRequestsActions', esnCollaborationMembershipRequestsActions());

  function esnCollaborationMembershipRequestsActions() {
    return {
      bindings: {
        objectType: '@',
        collaboration: '=',
        user: '='
      },
      controller: 'ESNCollaborationMembershipRequestsActionsController',
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/membership/collaboration-membership-requests-actions.html'
    };
  }
})();

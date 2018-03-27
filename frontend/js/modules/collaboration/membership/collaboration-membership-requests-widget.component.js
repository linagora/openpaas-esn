(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembershipRequestsWidget', esnCollaborationMembershipRequestsWidget());

  function esnCollaborationMembershipRequestsWidget() {
    return {
      bindings: {
        objectType: '@',
        collaboration: '='
      },
      controller: 'ESNCollaborationMembershipRequestsWidgetController',
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/membership/collaboration-membership-requests-widget.html'
    };
  }
})();

(function(angular) {
  'use strict';

  angular.module('esn.community')
    .component('esnCommunityPendingInvitationDisplay', esnCommunityPendingInvitationDisplay());

  function esnCommunityPendingInvitationDisplay() {
    return {
      bindings: {
        request: '=',
        community: '='
      },
      controller: 'ESNCommunityPendingInvitationDisplayController',
      controllerAs: '$ctrl',
      templateUrl: '/views/modules/community/pending-invitation/community-pending-invitation-display.html'
    };
  }

})(angular);

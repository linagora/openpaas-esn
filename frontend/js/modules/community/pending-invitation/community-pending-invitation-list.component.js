(function(angular) {
  'use strict';

  angular.module('esn.community')
    .component('esnCommunityPendingInvitationList', esnCommunityPendingInvitationList());

  function esnCommunityPendingInvitationList() {
    return {
      bindings: {
        community: '=',
        elementsPerPage: '=?',
        objectTypeFilter: '@?',
        scrollInsideContainer: '@?'
      },
      controller: 'ESNCommunityPendingInvitationListController',
      controllerAs: '$ctrl',
      templateUrl: '/views/modules/community/pending-invitation/community-pending-invitation-list.html'
    };
  }
})(angular);

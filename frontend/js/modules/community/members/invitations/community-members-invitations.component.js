(function(angular) {
  'use strict';

  angular.module('esn.community').component('esnCommunityMembersInvitations', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersInvitationsController',
    templateUrl: '/views/modules/community/members/invitations/community-members-invitations.html'
  });

})(angular);

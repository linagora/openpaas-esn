(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMemberAvatar', esnCollaborationMemberAvatar());

  function esnCollaborationMemberAvatar() {
    return {
      bindings: {
        member: '=',
        collaboration: '='
      },
      controller: 'ESNCollaborationMemberAvatarController',
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/member/collaboration-member-avatar.html'
    };
  }
})();

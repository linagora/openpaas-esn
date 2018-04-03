(function(angular) {
  'use strict';

  angular.module('esn.collaboration').component('esnCollaborationMember', {
    bindings: {
      collaboration: '=',
      member: '='
    },
    controller: 'ESNCollaborationMemberController',
    controllerAs: 'ctrl',
    templateUrl: '/views/modules/collaboration/member/collaboration-member.html'
  });
})(angular);

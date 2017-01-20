(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembersList', esnCollaborationMembersList());

  function esnCollaborationMembersList() {
    return {
      bindings: {
        collaboration: '=',
        collaborationType: '@',
        objectTypeFilter: '@',
        memberCount: '=',
        spinnerKey: '@',
        readable: '='
      },
      controller: 'ESNCollaborationMembersListController',
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/members/collaboration-members-list.html'
    };
  }
})();

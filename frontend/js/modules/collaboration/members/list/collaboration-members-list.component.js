(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembersList', esnCollaborationMembersList());

    function esnCollaborationMembersList() {
      return {
        templateUrl: '/views/modules/collaboration/members/list/collaboration-members-list.html',
        controller: 'ESNCollaborationMembersListController',
        controllerAs: 'ctrl',
        bindings: {
          collaboration: '=',
          elementsPerPage: '@?',
          objectTypeFilter: '@?',
          scrollInsideContainer: '@?'
        }
      };
    }
})();

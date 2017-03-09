(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembersAddItem', esnCollaborationMembersAddItem());

  function esnCollaborationMembersAddItem() {
    return {
      templateUrl: '/views/modules/collaboration/members/add/add-item/collaboration-members-add-item.html',
      controller: 'ESNCollaborationMembersAddItemController',
      controllerAs: 'ctrl',
      bindings: {
        member: '=',
        objectType: '=',
        collaboration: '='
      }
    };
  }
})();

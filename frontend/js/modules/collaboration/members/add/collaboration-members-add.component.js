(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembersAdd', esnCollaborationMembersAdd());

  function esnCollaborationMembersAdd() {
    return {
      templateUrl: '/views/modules/collaboration/members/add/collaboration-members-add.html',
      controller: 'ESNCollaborationMembersAddController',
      controllerAs: 'ctrl',
      bindings: {
        collaboration: '=',
        objectType: '=',
        elementsPerPage: '@?',
        scrollInsideContainer: '@?',
        options: '='
      }
    };
  }
})();

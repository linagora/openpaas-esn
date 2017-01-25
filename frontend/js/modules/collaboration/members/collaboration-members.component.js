(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembers', esnCollaborationMembers());

  function esnCollaborationMembers() {
    return {
      bindings: {
        collaboration: '=',
        objectTypeFilter: '@',
        readable: '='
      },
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/members/collaboration-members.html'
    };
  }
})();

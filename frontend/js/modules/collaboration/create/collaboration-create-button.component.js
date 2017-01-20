(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationCreateButton', esnCollaborationCreateButton());

  function esnCollaborationCreateButton() {
    return {
      templateUrl: '/views/modules/collaboration/create/collaboration-create-button.html'
    };
  }
})();

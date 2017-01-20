(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationService', esnCollaborationService);

  function esnCollaborationService() {
    return {
      isManager: isManager
    };

    function isManager(collaboration, user) {
      return collaboration.creator === user._id;
    }
  }
})();

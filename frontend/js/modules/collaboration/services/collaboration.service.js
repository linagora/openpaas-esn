(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationService', esnCollaborationService);

  function esnCollaborationService(esnCollaborationRegistry) {
    return {
      isManager: isManager
    };

    function isManager(collaboration, user) {
      var registry = esnCollaborationRegistry.get(collaboration.objectType);

      if (registry) {
        return registry.member.isManager(collaboration, user);
      }

      return collaboration.creator === user._id;
    }
  }
})();

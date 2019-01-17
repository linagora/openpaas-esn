(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersController', ESNCommunityMembersController);

  function ESNCommunityMembersController(communityService, session) {
    var self = this;

    self.canRead = canRead;
    self.isCommunityManager = isCommunityManager;

    function canRead() {
      return communityService.canRead(self.community);
    }

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

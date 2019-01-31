(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersInvitationsController', ESNCommunityMembersInvitationsController);

  function ESNCommunityMembersInvitationsController(communityService, session) {
    var self = this;

    self.isCommunityManager = isCommunityManager;

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

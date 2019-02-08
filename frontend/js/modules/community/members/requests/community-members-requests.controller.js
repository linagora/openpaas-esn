(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersRequestsController', ESNCommunityMembersRequestsController);

  function ESNCommunityMembersRequestsController($rootScope, communityAPI, communityService, session) {
    var self = this;

    self.error = false;
    self.isCommunityManager = isCommunityManager;

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

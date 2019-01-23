(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersRequestsController', ESNCommunityMembersRequestsController);

  function ESNCommunityMembersRequestsController($rootScope, communityAPI, communityService, session, ESN_COLLABORATION_MEMBER_EVENTS) {
    var self = this;

    self.members = self.community.members_count;
    self.error = false;
    self.isCommunityManager = isCommunityManager;
    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      self.collaborationInviteUser = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.USERS, updateCount);
      self.collaborationInviteUserCancel = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.CANCEL, updateCount);
      self.collaborationRequestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, updateCount);
      self.collaborationRequestDeclined = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.DECLINED, updateCount);
    }

    function $onDestroy() {
      self.collaborationInviteUser();
      self.collaborationInviteUserCancel();
      self.collaborationRequestAccepted();
      self.collaborationRequestDeclined();
    }

    function updateCount() {
      communityAPI.get(self.community._id).then(function(response) {
        self.members = response.data.members_count;
      });
    }

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersTabsController', ESNCommunityMembersTabsController);

  function ESNCommunityMembersTabsController($rootScope, communityAPI, communityService, session, ESN_COLLABORATION_MEMBER_EVENTS) {
    var self = this;

    self.error = false;
    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;
    self.isCommunityManager = isCommunityManager;
    self.updateCount = updateCount;

    function $onInit() {
      updateCount();
      self.collaborationInviteUser = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.USERS, updateCount);
      self.collaborationInviteUserCancel = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.CANCEL, updateCount);
      self.collaborationRequestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, updateCount);
      self.collaborationRequestDeclined = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.DECLINED, updateCount);
      self.collaborationMemberAdded = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ADDED, updateCount);
      self.collaborationMemberRemoved = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.REMOVED, updateCount);
    }

    function $onDestroy() {
      self.collaborationInviteUser();
      self.collaborationInviteUserCancel();
      self.collaborationRequestAccepted();
      self.collaborationRequestDeclined();
      self.collaborationMemberAdded();
      self.collaborationMemberRemoved();
    }

    function updateCount() {
      communityAPI.get(self.community._id).then(function(response) {
        self.members_count = response.data.members_count;
        self.members_invitations_count = response.data.members_invitations_count;
        self.members_requests_count = response.data.members_requests_count;
      });
    }

    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

(function(angular) {
  'use strict';

  angular.module('esn.community').controller('ESNCommunityMembersRequestsController', ESNCommunityMembersRequestsController);

  function ESNCommunityMembersRequestsController($rootScope, communityAPI, communityService, session, esnCollaborationClientService, ESN_COLLABORATION_MEMBER_EVENTS) {
    var self = this;
    var calling = false;

    self.members = self.community.members_count;
    self.error = false;
    self.isCommunityManager = isCommunityManager;
    self.$onDestroy = $onDestroy;
    self.$onInit = $onInit;

    function $onInit() {
      self.requestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, onRequestAccepted);
      self.requestDeclined = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.DECLINED, updateRequests);
      updateRequests();
    }

    function $onDestroy() {
      self.requestAccepted();
      self.requestDeclined();
    }

    function updateRequests() {
      if (calling) {
        return;
      }
      calling = true;
      esnCollaborationClientService.getRequestMemberships('community', self.community._id, {}).then(function(response) {
        self.invitations = response.data.filter(function(membership) {
          return membership.workflow === 'invitation';
        }).length || 0;

        self.requests = response.data.filter(function(membership) {
          return membership.workflow === 'request';
        }).length || 0;

      }, function() {
        self.error = true;
      }).finally(function() {
        calling = false;
      });
    }

    function updateCount() {
      communityAPI.get(self.community._id).then(function(response) {
        self.members = response.data.members_count;
      });
    }

    function onRequestAccepted() {
      updateRequests();
      updateCount();
    }
    function isCommunityManager() {
      return communityService.isManager(self.community, session.user);
    }
  }
})(angular);

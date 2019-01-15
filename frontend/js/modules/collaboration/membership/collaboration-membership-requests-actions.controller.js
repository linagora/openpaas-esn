(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembershipRequestsActionsController', ESNCollaborationMembershipRequestsActionsController);

  function ESNCollaborationMembershipRequestsActionsController($rootScope, esnCollaborationClientService, ESN_COLLABORATION_MEMBER_EVENTS) {
    var self = this;

    self.accept = accept;
    self.decline = decline;
    self.done = false;
    self.error = false;
    self.sending = false;

    function accept() {
      self.sending = true;
      self.error = false;
      esnCollaborationClientService.join(self.objectType, self.collaboration._id, self.user._id).then(function() {
        self.done = true;
        $rootScope.$emit(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, {
          collaboration: {objectType: self.objectType, id: self.collaboration._id},
          user: self.user._id
        });
      }, function() {
        self.error = true;
      }).finally(function() {
        self.sending = false;
      });
    }

    function decline() {
      self.sending = true;
      self.error = false;
      esnCollaborationClientService.cancelRequestMembership(self.objectType, self.collaboration._id, self.user._id).then(function() {
        self.done = true;
        $rootScope.$emit(ESN_COLLABORATION_MEMBER_EVENTS.DECLINED, {
          collaboration: {objectType: self.objectType, id: self.collaboration._id},
          user: self.user._id
        });
      }, function() {
        self.error = true;
      }).finally(function() {
        self.sending = false;
      });
    }
  }
})();

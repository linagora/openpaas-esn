(function(angular) {
  'use strict';

  angular.module('esn.collaboration').controller('ESNCollaborationMemberController', ESNCollaborationMemberController);

  function ESNCollaborationMemberController(
    $log,
    $rootScope,
    notificationFactory,
    session,
    esnCollaborationService,
    esnCollaborationClientService,
    ESN_COLLABORATION_MEMBER_EVENTS
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.removeMember = removeMember;

    function $onInit() {
      self.isCollaborationManager = esnCollaborationService.isManager(self.collaboration, session.user);
      if (self.collaboration.creator === self.member._id) {
        self.creator = true;
      }
    }

    function removeMember() {
      esnCollaborationClientService.removeMember(self.collaboration.objectType, self.collaboration._id, self.member._id)
        .then(function() {
          notificationFactory.weakInfo('Collaboration updated', 'Member has been removed');
          $rootScope.$broadcast(ESN_COLLABORATION_MEMBER_EVENTS.REMOVED, self.member);
        })
        .catch(function(err) {
          $log.error('Error while removing member', err);
          notificationFactory.weakError('Error', 'The member can not be removed');
        });
    }
  }
})(angular);

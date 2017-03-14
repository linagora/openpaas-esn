(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembersAddItemController', ESNCollaborationMembersAddItemController);

  function ESNCollaborationMembersAddItemController(esnCollaborationClientService, notificationFactory) {
    var self = this;

    self.invited = false;
    self.inviteMember = inviteMember;

    function inviteMember() {

      return esnCollaborationClientService.requestMembership(self.objectType, self.collaboration._id, self.member._id).then(function() {
        notificationFactory.weakSuccess('Success', 'Invitation have been sent');
        self.invited = true;
      }, function() {
        notificationFactory.weakError('Error', 'The member cannot be invited');
        self.invited = false;
      });
    }
  }
})();

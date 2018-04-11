(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMemberAvatarController', ESNCollaborationMemberAvatarController);

  function ESNCollaborationMemberAvatarController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.member.user.preferredEmail) {
        self.email = self.member.user.preferredEmail;
      } else {
        self.email = self.member.user.accounts[0].emails[0];
      }

      if (self.collaboration.creator === self.member.user._id) {
        self.creator = true;
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMemberAvatarController', ESNCollaborationMemberAvatarController);

  function ESNCollaborationMemberAvatarController() {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if (self.member.user.firstname || self.member.user.lastname) {
        self.title = (self.member.user.firstname || '') + ' ' + (self.member.user.lastname || '');
      } else {
        self.title = self.member.user.emails[0];
      }

      self.tooltip = {
        title: self.title
      };

      if (self.collaboration.creator === self.member.user._id) {
        self.creator = true;
      }
    }
  }
})();

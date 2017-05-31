(function() {
  'use strict';

  angular.module('esn.avatar')
    .controller('ESNAvatarListController', ESNAvatarListController);

  function ESNAvatarListController() {
    var self = this;
    var defaultLimit;

    self.$onInit = $onInit;
    self.switchDisplay = switchDisplay;
    self.isLimitedDisplay = isLimitedDisplay;
    self.canShowButton = canShowButton;

    function $onInit() {
      defaultLimit = self.limit;

      if (!self.profileLink) {
        self.profileLink = 'profile({user_id: member.id})';
      }
    }

    function switchDisplay() {
      if (isLimitedDisplay()) {
        self.limit = self.members.length;
      } else {
        self.limit = defaultLimit;
      }
    }

    function isLimitedDisplay() {
      return self.limit === defaultLimit;
    }

    function canShowButton() {
      return self.members.length > defaultLimit;
    }
  }
})();

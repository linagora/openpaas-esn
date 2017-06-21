(function() {
  'use strict';

  angular.module('esn.profile-menu')
    .controller('ESNProfileMenuController', ESNProfileMenuController);

  function ESNProfileMenuController() {
    var self = this;

    self.avatarURL = '/api/user/profile/avatar?cb=' + Date.now();

    self.openMenu = function($mdMenu, event) {
      $mdMenu.open(event);
    };
  }
})();

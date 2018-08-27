(function() {
  'use strict';

  angular.module('esn.profile-menu')
    .controller('ESNProfileMenuController', ESNProfileMenuController);

  function ESNProfileMenuController($scope, session, esnAvatarUrlService) {
    var self = this;

    self.$onInit = $onInit;
    self.openMenu = openMenu;

    function $onInit() {
      self.avatarURL = esnAvatarUrlService.generateForCurrentUser(true);

      $scope.$on('avatar:updated', onAvatarUpdated);
    }

    function openMenu($mdMenu, event) {
      $mdMenu.open(event);
    }

    function onAvatarUpdated(event, user) {
      if (user && user._id === session.user._id) {
        self.avatarURL = esnAvatarUrlService.generateForCurrentUser(true);
      }
    }
  }
})();

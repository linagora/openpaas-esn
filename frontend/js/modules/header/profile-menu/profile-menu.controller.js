(function() {
  'use strict';

  angular.module('esn.profile-menu')
    .controller('ESNProfileMenuController', ESNProfileMenuController);

  function ESNProfileMenuController($scope, esnAvatarUrlService) {
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

    function onAvatarUpdated() {
      self.avatarURL = esnAvatarUrlService.generateForCurrentUser(true);
    }
  }
})();

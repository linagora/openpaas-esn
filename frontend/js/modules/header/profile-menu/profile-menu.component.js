(function() {
'use strict';

  angular.module('esn.profile-menu')
    .component('profileMenu', {
      templateUrl: '/views/modules/header/profile-menu/profile-menu.html',
      controller: 'ESNProfileMenuController',
      controllerAs: 'ctrl'
    });
})();

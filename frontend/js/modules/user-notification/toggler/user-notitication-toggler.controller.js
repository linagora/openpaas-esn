(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('EsnUserNotificationTogglerController', EsnUserNotificationTogglerController);

  function EsnUserNotificationTogglerController($scope, matchmedia, $state, SM_XS_MEDIA_QUERY) {
    $scope.open = open;

    function open() {
      (matchmedia.is(SM_XS_MEDIA_QUERY) ? openForMobile : openForDesktop)();
    }

    function openForMobile() {
      $state.go('user-notification.list');
    }

    function openForDesktop() {
      $scope.popover && $scope.popover.toggle();
    }
  }
})();

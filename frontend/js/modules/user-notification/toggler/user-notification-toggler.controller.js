(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('EsnUserNotificationTogglerController', EsnUserNotificationTogglerController);

  function EsnUserNotificationTogglerController($scope, matchmedia, $state, ESN_MEDIA_QUERY_SM_XS, esnUserNotificationCounter) {
    $scope.open = open;
    $scope.notificationsCounter = esnUserNotificationCounter;

    function open() {
      (matchmedia.is(ESN_MEDIA_QUERY_SM_XS) ? openForMobile : openForDesktop)();
    }

    function openForMobile() {
      $state.go('user-notification.list');
    }

    function openForDesktop() {
      $scope.popover && $scope.popover.toggle();
    }
  }
})();

(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('EsnUserNotificationTogglerController', EsnUserNotificationTogglerController);

  function EsnUserNotificationTogglerController(
    $scope,
    $state,
    matchmedia,
    esnUserNotificationState,
    ESN_MEDIA_QUERY_SM_XS
  ) {
    $scope.open = open;
    $scope.getNumberOfNotifications = getNumberOfNotifications;
    $scope.hasImportantNotifications = hasImportantNotifications;

    function open() {
      (matchmedia.is(ESN_MEDIA_QUERY_SM_XS) ? openForMobile : openForDesktop)();
    }

    function getNumberOfNotifications() {
      return esnUserNotificationState.getCount();
    }

    function hasImportantNotifications() {
      return esnUserNotificationState.getNumberOfImportantNotifications() > 0;
    }

    function openForMobile() {
      $state.go('user-notification.list');
    }

    function openForDesktop() {
      $scope.popover && $scope.popover.toggle();
    }
  }
})();

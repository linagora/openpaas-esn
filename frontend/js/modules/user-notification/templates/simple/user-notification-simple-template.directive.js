(function() {
  'use strict';

  angular.module('esn.user-notification')
    .directive('esnUserNotificationSimpleTemplate', esnUserNotificationSimpleTemplate);

  function esnUserNotificationSimpleTemplate(esnUserNotificationService) {
    return {
      controller: controller,
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/simple/user-notification-simple-template.html'
    };

    function controller($scope) {
      var acknowledging = false;

      $scope.acknowledge = function() {
        if (acknowledging) {
          return;
        }
        acknowledging = true;
        esnUserNotificationService.setAcknowledged($scope.notification._id, true).then(
          function() {
            $scope.notification.acknowledged = true;
          },
          function(error) {
            $scope.error = error;
          }
        );

      };
    }
  }
})();

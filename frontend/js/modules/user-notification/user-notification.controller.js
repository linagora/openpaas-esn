(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('ESNUserNotificationController', ESNUserNotificationController);

    function ESNUserNotificationController(
      $log,
      $scope,
      $timeout,
      esnUserNotificationService,
      esnUserNotificationCounter,
      livenotification
    ) {
      $scope.unreadCount = esnUserNotificationCounter;
      $scope.unreadCount.init();

      $scope.setAsRead = function(id) {
        $scope.unreadCount.decreaseBy(1);
        esnUserNotificationService
          .setRead(id, true)
          .then(function() {
            $log.debug('Successfully setting ' + id + ' as read');
          }, function(err) {
            $log.error('Error setting ' + id + ' as read: ' + err);
          })
          .finally(function() {
            $scope.unreadCount.refresh();
          });
      };

      $scope.setAllAsRead = function(ids) {
        $scope.unreadCount.decreaseBy(ids.length);
        esnUserNotificationService
          .setAllRead(ids, true)
          .then(function() {
            $log.debug('Successfully setting ' + ids.toString() + ' as read');
          }, function(err) {
            $log.error('Error setting ' + ids.toString() + ' as read: ' + err);
          })
          .finally(function() {
          $scope.unreadCount.refresh();
        });
      };

      $scope.$on('usernotifications:received', function(event, usernotifications) {
        var ids = usernotifications.map(function(usernotification) {
          return usernotification._id;
        });

        $scope.setAllAsRead(ids);
      });

      function onUserNotificationCreated() {
        $scope.unreadCount.increaseBy(1);
        $scope.unreadCount.refresh();
      }

      livenotification('/usernotification').on('usernotification:created', onUserNotificationCreated);
      $scope.$on('$destroy', function() {
        livenotification('/usernotification').removeListener('usernotification:created', onUserNotificationCreated);
      });
    }
  })();

'use strict';

angular.module('esn.conference-notification', ['esn.websocket', 'esn.session', 'esn.notification'])
  .directive('conferenceNotification', ['session', 'notificationFactory', 'livenotification',
    function(session, notificationFactory, livenotification) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          function liveNotificationHandler(msg) {
            if (msg.user_id !== session.user._id) {
              notificationFactory.weakInfo('Conference updated !', msg.message);
            }
          }

          var socketIORoom = livenotification('/conferences', attrs.conferenceId)
            .on('notification', liveNotificationHandler);

          scope.$on('$destroy', function() {
            socketIORoom.removeListener('notification', liveNotificationHandler);
          });
        }
      };
    }])

  .directive('conferenceInvitationNotification', ['$window', '$timeout', '$log', 'notificationFactory', 'livenotification',
    function($window, $timeout, $log, notificationFactory, livenotification) {
      return {
        restrict: 'E',
        link: function(scope) {

          function onConfirm(msg) {
            if (!msg.conference_id) {
              return;
            }
            $timeout(function() {
              $window.open('/conferences/' + msg.conference_id, 'Conference', 'menubar=no,location=no,resizable=yes,scrollbar=no,status=no');
            }, 0);
          }

          function liveNotificationHandler(msg) {
            $log.debug('New invitation of namespace /conferences with data', msg);
            notificationFactory.confirm('Conference invitation', 'You have been invited to a conference. Want to join?', 'fa-phone', ['Join', 'Decline'], msg, onConfirm);
          }

          var sio = livenotification('/conferences').on('invitation', liveNotificationHandler);

          scope.$on('$destroy', function() {
            sio.removeListener('invitation', liveNotificationHandler);
          });
        }
      };
    }]);

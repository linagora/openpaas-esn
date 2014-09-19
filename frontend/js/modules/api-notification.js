'use strict';

angular.module('esn.api-notification', ['esn.notification'])
  .directive('apiNotification', ['$log', 'session', 'notificationFactory', 'livenotification',
    function($log, session, notificationFactory, livenotification) {
      return {
        restrict: 'E',
        link: function(scope) {

          function liveNotificationHandler(msg) {
            function displayNotification() {
              return msg.target.some(function(target) {
                return target.objectType === 'community' || target.id === session.user._id;
              });// && msg.parent;
            }

            if (displayNotification()) {
              $log.debug('New notification of namespace /notifications with data', msg);

              var text = msg.author + ' ' + msg.action + ' a ' + msg.object;
              if (msg.link) {
                text = 'Check it out on <a target="_blank" href=\"' + msg.link + '\">link</a>';
              }
              notificationFactory.strongInfo(msg.title || 'New notification', text);
            }
          }

          var sio = livenotification('/notifications').on('notification', liveNotificationHandler);

          scope.$on('$destroy', function() {
            sio.removeListener('notification', liveNotificationHandler);
          });
        }
      };
    }]);

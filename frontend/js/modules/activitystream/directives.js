'use strict';

angular.module('esn.activitystream')
.directive('activityStreamUpdatesNotifier', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/views/modules/activitystream/updates-notifier.html'
  };
})
.directive('activityStreamNotification', ['moment', 'session', 'livenotification', 'notificationFactory',
  function(moment, session, livenotification, notificationFactory) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      function liveNotificationHandler(msg) {
        if (msg.actor && msg.actor._id !== session.user._id) {
          var m = moment(new Date(msg.published).getTime());
          notificationFactory.weakInfo('Activity Stream updated',
              msg.actor.displayName + ' added a message ' + m.fromNow());

          scope.updates = scope.updates || [];
          scope.updates.push(msg);
        }
      }

      var socketIORoom = livenotification('/activitystreams', attrs.activitystreamUuid)
        .on('notification', liveNotificationHandler);

      scope.$on('$destroy', function() {
        socketIORoom.removeListener('notification', liveNotificationHandler);
      });
    }
  };
}])
.directive('activityStream', ['messageAPI', '$rootScope', '$timeout', function(messageAPI, $rootScope, $timeout) {
    return {
      restrict: 'E',
      scope: {
        writable: '='
      },
      replace: true,
      templateUrl: '/views/modules/activitystream/activitystream.html',
      controller: 'activitystreamController',
      link: function(scope, element, attrs) {
        scope.activitystreamUuid = attrs.activitystreamUuid;
        var currentActivitystreamUuid = scope.activitystreamUuid;

        scope.lastPost = {
          messageId: null,
          comment: null
        };

        function onMessagePosted(evt, msgMeta) {
          if (msgMeta.activitystreamUuid !== scope.activitystreamUuid) {
            return;
          }
          if (scope.restActive) {
            return;
          }
          scope.getStreamUpdates();
          scope.lastPost.messageId = msgMeta.id;
        }

        function getThreadById(id) {
          var thread = null;
          scope.threads.every(function(msg) {
            if (msg._id === id) {
              thread = msg;
              return false;
            }
            return true;
          });
          return thread;
        }

        function updateMessage(message) {
          if (scope.restActive) {
            return;
          }
          scope.restActive = true;
          var parentId = message._id;
          messageAPI.get(parentId).then(function(response) {
            var message = response.data;
            var thread = getThreadById(parentId);
            if (thread) {
              thread.responses = message.responses;
            }
          }).finally (function() {
            scope.restActive = false;
          });

        }

        function onCommentPosted(evt, msgMeta) {
          var thread = getThreadById(msgMeta.parent._id);
          if (thread) {
            updateMessage(thread);
            scope.lastPost.comment = {
              id: msgMeta.id,
              parentId: msgMeta.parent._id
            };
          }
        }
        //initialization code

        // let sub-directives load and register event listeners
        // before we start fetching the stream
        $timeout(function() {
          scope.loadMoreElements();
          $rootScope.$emit('activitystream:updated', {
            activitystreamUuid: currentActivitystreamUuid
          });
        },0);

        var unregMsgPostedListener = $rootScope.$on('message:posted', onMessagePosted);
        var unregCmtPostedListener = $rootScope.$on('message:comment', onCommentPosted);

        scope.$watch('activitystreamUuid', function() {
          if (scope.activitystreamUuid === currentActivitystreamUuid) {
            return;
          }
          scope.reset();
          scope.loadMoreElements();
          currentActivitystreamUuid = scope.activitystreamUuid;
        });

        scope.$on('$destroy', function() {
          unregMsgPostedListener();
          unregCmtPostedListener();
        });
      }
    };
  }]
);

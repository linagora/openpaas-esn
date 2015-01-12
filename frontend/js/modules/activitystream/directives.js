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
    link: function(scope) {
      function liveNotificationHandler(msg) {
        if (msg.actor && msg.actor._id !== session.user._id) {
          var m = moment(new Date(msg.published).getTime());
          notificationFactory.weakInfo('Activity Stream updated',
              msg.actor.displayName + ' added a message ' + m.fromNow());

          scope.updates = scope.updates || [];
          scope.updates.push(msg);
        }
      }

      var socketIORoom = livenotification('/activitystreams', scope.activitystreamUuid)
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
        calendarId: '=',
        streams: '=',
        activitystream: '='
      },
      replace: true,
      templateUrl: '/views/modules/activitystream/activitystream.html',
      controller: 'activitystreamController',
      link: function(scope) {
        scope.streams = scope.streams || [];
        scope.streams = scope.streams.concat(scope.activitystream);

        scope.lastPost = {
          messageId: null,
          comment: null
        };

        function isInStreams(id) {
          return scope.streams.some(function(stream) {
            return stream.activity_stream.uuid === id;
          });
        }

        function onMessagePosted(evt, msgMeta) {
          if (!isInStreams(msgMeta.activitystreamUuid)) {
            return;
          }
          if (scope.restActive[msgMeta.activitystreamUuid] || scope.updateMessagesActive) {
            return;
          }
          scope.getStreamUpdates(msgMeta.activitystreamUuid);
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
          var running = message.shares.filter(function(share) {
              return share.objectType === 'activitystream' && scope.restActive[share.id];
            });

          if (running.length > 0 || scope.updateMessagesActive) {
            return;
          }

          message.shares.forEach(function(share) {
            if (share.objectType === 'activitystream' && scope.streams.indexOf(share.id) !== -1) {
              scope.restActive[share.id] = true;
            }
          });

          var parentId = message._id;
          messageAPI.get(parentId).then(function(response) {
            var message = response.data;
            var thread = getThreadById(parentId);
            if (thread) {
              thread.responses = message.responses;
            }
          }).finally (function() {
            message.shares.forEach(function(share) {
              if (share.objectType === 'activitystream' && scope.streams.indexOf(share.id) !== -1) {
                scope.restActive[share.id] = false;
              }
            });
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
          scope.reset();
          scope.loadMoreElements();
          scope.streams.forEach(function(stream) {
            $rootScope.$emit('activitystream:updated', {
              activitystreamUuid: stream.activity_stream.uuid
            });
          });
        },0);

        var unregMsgPostedListener = $rootScope.$on('message:posted', onMessagePosted);
        var unregCmtPostedListener = $rootScope.$on('message:comment', onCommentPosted);

        scope.$on('$destroy', function() {
          unregMsgPostedListener();
          unregCmtPostedListener();
        });
      }
    };
  }])
  .directive('activityStreamOrigin', function() {
    return {
      scope: {
        currentstream: '=',
        message: '=',
        streams: '='
      },
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/activitystream/activitystream-origin.html',
      controller: function($scope) {

        $scope.currentMessageInStreams = function() {
          if (!$scope.streams || $scope.streams.length === 0 || !$scope.message.shares) {
            return false;
          }

          return $scope.message.shares.some(function(share) {
            return share.objectType === 'activitystream' && $scope.streams.some(function(stream) {
              return stream.activity_stream.uuid === share.id && stream.activity_stream.uuid !== $scope.currentstream.activity_stream.uuid;
            });
          });
        };

        $scope.getMessageStreamOrigins = function() {
          return $scope.streams.filter(function(stream) {
            return $scope.message.shares && $scope.message.shares.some(function(share) {
              return share.objectType === 'activitystream' && share.id === stream.activity_stream.uuid;
            });
          });
        };
      }
    };
  })
.directive('activityStreamCard', function() {
  return {
    scope: {
      stream: '='
    },
    restrict: 'E',
    replace: true,
    templateUrl: '/views/modules/activitystream/activitystream-card.html'
  };
});

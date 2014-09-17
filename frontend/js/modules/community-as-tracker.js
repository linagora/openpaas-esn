'use strict';

angular.module('esn.community-as-tracker', [
  'restangular',
  'esn.session',
  'esn.websocket',
  'esn.activitystream',
  'esn.community'
])
  .factory('communityAStrackerAPI', ['Restangular', function(Restangular) {
    function getCommunityActivityStreams(uuid) {
      return Restangular.one('user').getList('activitystreams', {domainid: uuid});
    }
    function getUnreadCount(id) {
      return Restangular.one('activitystreams', id).one('unreadcount').get();
    }
    return {
      getCommunityActivityStreams: getCommunityActivityStreams,
      getUnreadCount: getUnreadCount
    };
  }])
  .factory('communityAStrackerHelpers', ['communityAStrackerAPI', '$q', 'session', function(communityAStrackerAPI, $q, session) {
    /**
     * Helper to get multiple activity streams
     * @param {array} ids an array of ids
     * @param {function} callback fn like callback(err, activityStreams)
     */
    function getUnreadsCount(ids, callback) {
      var unreadsCount = [];

      var promises = ids.map(function(id) {
        var defer = $q.defer();
        communityAStrackerAPI.getUnreadCount(id).then(
          function(response) {
            unreadsCount.push(response.data);
            defer.resolve();
          },
          function(err) {
            defer.reject(err);
          });
        return defer.promise;
      });

      $q.all(promises).then(function() {
        callback(null, unreadsCount);
      }, callback);
    }

    /**
     * Helper to get the activity streams with unread count.
     * activityStreamsWithUnreadCount = [
     *   {
     *     uuid: {string},
     *     display_name: {string},
     *     href: {string},
     *     img: {string},
     *     unread_count: {number}
     *   },
     *   { ... }
     * ]
     * @param {function} callback - fn like callback(err, activityStreamsWithUnreadCount)
     */
    function getCommunityActivityStreamsWithUnreadCount(callback) {
      communityAStrackerAPI.getCommunityActivityStreams(session.domain._id).then(function(response) {
        var activityStreams = response.data;

        var ids = activityStreams.map(function(element) {
          return element.uuid;
        });

        getUnreadsCount(ids, function(err, unreadsCount) {
          if (err) { return callback(err); }
          var activityStreamsWithUnreadCount = activityStreams.map(function(elementMap) {
            var result = {
              uuid: elementMap.uuid,
              display_name: elementMap.target.displayName,
              href: '#',
              img: '',
              unread_count: 0
            };

            activityStreams.some(function(elementSome) {
              if (elementSome.uuid === elementMap.uuid && elementSome.target.objectType === 'community') {
                result.href = '/#/communities/' + elementSome.target._id;
                result.img = '/api/communities/' + elementSome.target._id + '/avatar';
                return true;
              }
            });

            unreadsCount.some(function(elementSome) {
              if (elementSome._id === elementMap.uuid) {
                result.unread_count = elementSome.unread_count;
                return true;
              }
            });
            return result;
          });
          return callback(null, activityStreamsWithUnreadCount);
        });
      }, callback);
    }
    return {
      getCommunityActivityStreamsWithUnreadCount: getCommunityActivityStreamsWithUnreadCount
    };
  }])
  .directive('listCommunityActivityStreams', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-as-tracker.html'
    };
  })
  .controller('communityAStrackerController',
  ['$rootScope', '$scope', '$log', '$timeout', 'communityAStrackerHelpers', 'communityAStrackerAPI', 'communityAPI', 'livenotification', 'session',
    function($rootScope, $scope, $log, $timeout, communityAStrackerHelpers, communityAStrackerAPI, communityAPI, livenotification, session) {

      var notifications = {};
      $scope.activityStreams = [];

      function updateUnread(activityStreamUuid, count) {
        if (! $scope.activityStreams) {
          return;
        }
        $scope.activityStreams.some(function(activityStream) {
          if (activityStream.uuid === activityStreamUuid) {
            activityStream.unread_count = count;
            return true;
          }
        });
      }

      function liveNotificationHandler(data) {
        var activityStreamUuid = data.target[0]._id;

        if (data.actor._id !== session.user._id) {
          communityAStrackerAPI.getUnreadCount(activityStreamUuid).then(function(response) {
            updateUnread(activityStreamUuid, response.data.unread_count);
          });
        }
      }

      $scope.getUnreadUpdate = function(activityStreamUuid) {
        updateUnread(activityStreamUuid, 0);
        $rootScope.$emit('activitystream:userUpdateRequest', {
          activitystreamUuid: activityStreamUuid
        });
      };

      $scope.$on('$destroy', function() {
        notifications.forEach(function(notification) {
          notification.removeListener('notification', liveNotificationHandler);
        });
      });

      $rootScope.$on('activitystream:updated', function(evt, data) {
        if (data && data.activitystreamUuid) {
          // Usage of $timeout is to wait the tracker update in database
          $timeout(function() {
            communityAStrackerAPI.getUnreadCount(data.activitystreamUuid).then(
              function(response) {
                updateUnread(data.activitystreamUuid, response.data.unread_count);
              }
            );
          }, 1000);
        }
      });

      function subscribeToStreamNotification(streamId) {
        var socketIORoom = livenotification('/activitystreams', streamId).on('notification', liveNotificationHandler);
        notifications[streamId] = socketIORoom;
      }

      function unsubscribeFromStreamNotification(streamId) {
        if (notifications[streamId]) {
          notifications[streamId].removeListener('notification', liveNotificationHandler);
        }
      }

      function addItem(stream) {
        $scope.activityStreams.push(stream);
      }

      function removeItem(streamId) {
        $scope.activityStreams = $scope.activityStreams.filter(function(stream) {
          return stream.uuid !== streamId;
        });
      }

      communityAStrackerHelpers.getCommunityActivityStreamsWithUnreadCount(function(err, result) {
        if (err) {
          $scope.error = 'Error while getting unread message: ' + err;
          $log.error($scope.error, err);
          return;
        }

        result.forEach(function(element) {
          subscribeToStreamNotification(element.uuid);
          addItem(element);
        });
      });

      function joinCommunityNotificationHandler(data) {
        communityAPI.get(data.community).then(function(success) {
          var uuid = success.data.activity_stream.uuid;
          subscribeToStreamNotification(uuid);

          var streamInfo = {
            uuid: uuid,
            href: '/#/communities/' + success.data._id,
            img: '/api/communities/' + success.data._id + '/avatar',
            display_name: success.data.title
          };
          addItem(streamInfo);

        }, function(err) {
          $log.debug('Error while getting community', err.data);
        });
      }

      function leaveCommunityNotificationHandler(data) {
        communityAPI.get(data.community).then(function(success) {
          var uuid = success.data.activity_stream.uuid;
          unsubscribeFromStreamNotification(uuid);
          removeItem(uuid);
        }, function(err) {
          $log.debug('Error while getting the community', err.data);
        });
      }

      livenotification('/community').on('leave', leaveCommunityNotificationHandler);
      livenotification('/community').on('join', joinCommunityNotificationHandler);
    }
  ]
);

'use strict';

angular.module('esn.communityAStracker', [
  'restangular',
  'esn.session',
  'esn.websocket',
  'esn.activitystream'
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
  ['$scope', '$log', 'communityAStrackerHelpers', 'communityAStrackerAPI', 'livenotification', 'session', 'activitystreamAPI',
    function($scope, $log, communityAStrackerHelpers, communityAStrackerAPI, livenotification, session, activitystreamAPI) {
      communityAStrackerHelpers.getCommunityActivityStreamsWithUnreadCount(function(err, result) {
        if (err) {
          $scope.error = 'Error while get unread message: ' + err;
          $log.error($scope.error, err);
          return;
        }
        $scope.activityStreams = result;

        function liveNotificationHandler(data) {
          var activityStreamUuid = data.target[0]._id;

          if (data.actor._id === session.user._id) {
            // Update the Timeline Entry Tracker
            activitystreamAPI.get(activityStreamUuid).then(function(response) {
            });
          } else {
            communityAStrackerAPI.getUnreadCount(activityStreamUuid).then(function(response) {
              $scope.activityStreams.some(function(activityStream) {
                if (activityStream.uuid === activityStreamUuid) {
                  activityStream.unread_count = response.data.unread_count;
                  return true;
                }
              });
            });
          }
        }

        var notifications = [];

        result.forEach(function(element) {
          notifications.push(livenotification('/activitystreams', element.uuid).on('notification', liveNotificationHandler));
        });

        $scope.$on('$destroy', function() {
          notifications.forEach(function(notification) {
            notification.removeListener('notification', liveNotificationHandler);
          });
        });
      });
    }]);

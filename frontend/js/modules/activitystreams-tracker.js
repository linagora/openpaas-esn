'use strict';

angular.module('esn.activitystreams-tracker', [
  'restangular',
  'esn.session',
  'esn.websocket',
  'esn.activitystream'
])
  .factory('ASTrackerAPI', ['$log', 'Restangular', function($log, Restangular) {

    function getActivityStreams(domainid, objectType) {
      return Restangular.one('user').getList('activitystreams', {domainid: domainid}).then(function(response) {
        response.data = response.data.filter(function(stream) {
          return stream.target && stream.target.objectType === objectType;
        });
        return response;
      });
    }

    function getUnreadCount(id) {
      $log.debug('Get unreads for stream ' + id);
      return Restangular.one('activitystreams', id).one('unreadcount').get();
    }
    return {
      getActivityStreams: getActivityStreams,
      getUnreadCount: getUnreadCount
    };
  }])
  .factory('AStrackerHelpers', ['ASTrackerAPI', '$q', 'session', function(ASTrackerAPI, $q, session) {
    /**
     * Helper to get multiple activity streams
     * @param {array} ids an array of ids
     * @param {function} callback fn like callback(err, activityStreams)
     */
    function getUnreadsCount(ids, callback) {
      var unreadsCount = [];

      var promises = ids.map(function(id) {
        var defer = $q.defer();
        ASTrackerAPI.getUnreadCount(id).then(
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
     *     target: {object},
     *     unread_count: {number}
     *   },
     *   { ... }
     * ]
     * @param {function} callback - fn like callback(err, activityStreamsWithUnreadCount)
     */
    function getActivityStreamsWithUnreadCount(objectType, callback) {
      ASTrackerAPI.getActivityStreams(session.domain._id, objectType).then(function(response) {
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
              if (elementSome.uuid === elementMap.uuid && elementSome.target.objectType === objectType) {
                result.target = elementSome.target;
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
      getActivityStreamsWithUnreadCount: getActivityStreamsWithUnreadCount
    };
  }])
  .controller('ASTrackerController', ['$rootScope', '$scope', '$timeout', 'ASTrackerNotificationService', 'ASTrackerAPI', function($rootScope, $scope, $timeout, ASTrackerNotificationService, ASTrackerAPI) {
    $scope.$on('$destroy', function() {
      ASTrackerNotificationService.removeAllListeners();
    });

    $rootScope.$on('activitystream:updated', function(evt, data) {
      if (data && data.activitystreamUuid) {
        // Usage of $timeout is to wait the tracker update in database
        $timeout(function() {
          ASTrackerAPI.getUnreadCount(data.activitystreamUuid).then(
            function(response) {
              ASTrackerNotificationService.updateUnread(data.activitystreamUuid, response.data.unread_count);
            }
          );
        }, 1000);
      }
    });
  }])
  .factory('ASTrackerNotificationService',
  ['$rootScope', '$log', '$timeout', 'AStrackerHelpers', 'ASTrackerAPI', 'livenotification', 'session',
    function($rootScope, $log, $timeout, AStrackerHelpers, ASTrackerAPI, livenotification, session) {

      this.notifications = {};
      this.activityStreams = [];
      var self = this;

      function updateUnread(activityStreamUuid, count) {
        if (! self.activityStreams) {
          return;
        }
        self.activityStreams.some(function(activityStream) {
          if (activityStream.uuid === activityStreamUuid) {
            activityStream.unread_count = count;
            return true;
          }
        });
      }

      function liveNotificationHandler(data) {
        var activityStreamUuid = data.target[0]._id;

        if (data.actor._id !== session.user._id) {
          ASTrackerAPI.getUnreadCount(activityStreamUuid).then(function(response) {
            updateUnread(activityStreamUuid, response.data.unread_count);
          });
        }
      }

      var getUnreadUpdate = function(activityStreamUuid) {
        updateUnread(activityStreamUuid, 0);
        $rootScope.$emit('activitystream:userUpdateRequest', {
          activitystreamUuid: activityStreamUuid
        });
      };

      function removeAllListeners() {
        self.notifications.forEach(function() {
          self.notification.removeListener('notification', liveNotificationHandler);
        });
      }

      function subscribeToStreamNotification(streamId) {
        var socketIORoom = livenotification('/activitystreams', streamId).on('notification', liveNotificationHandler);
        self.notifications[streamId] = socketIORoom;
      }

      function unsubscribeFromStreamNotification(streamId) {
        if (self.notifications[streamId]) {
          self.notifications[streamId].removeListener('notification', liveNotificationHandler);
        }
      }

      function addItem(stream) {
        self.activityStreams.push(stream);
      }

      function removeItem(streamId) {
        for (var i in self.activityStreams) {
          if (self.activityStreams[i].uuid === streamId) {
            self.activityStreams.splice(i, 1);
            break;
          }
        }
      }

      return {
        addItem: addItem,
        removeItem: removeItem,
        updateUnread: updateUnread,
        subscribeToStreamNotification: subscribeToStreamNotification,
        unsubscribeFromStreamNotification: unsubscribeFromStreamNotification,
        removeAllListeners: removeAllListeners,
        getUnreadUpdate: getUnreadUpdate,
        streams: self.activityStreams
      };
  }]);

'use strict';

angular.module('esn.activitystreams-tracker', [
  'esn.session',
  'esn.websocket',
  'esn.activitystream',
  'esn.user'
])
  .factory('ASTrackerAPI', ['$log', 'userAPI', 'activitystreamAPI', function($log, userAPI, activitystreamAPI) {

    function getActivityStreams(domainid, objectType) {
      return userAPI.getActivityStreams({domainid: domainid, member: true}).then(function(response) {
        response.data = response.data.filter(function(stream) {
          return stream.target && stream.target.objectType === objectType;
        });
        return response;
      });
    }

    function getUnreadCount(id) {
      $log.debug('Get unreads for stream ' + id);
      return activitystreamAPI.getUnreadCount(id);
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
  .controller('ASTrackerController', ['$rootScope', '$scope', '$timeout', '$log', 'ASTrackerNotificationService', 'ASTrackerAPI', 'ASTrackerSubscriptionService', function($rootScope, $scope, $timeout, $log, ASTrackerNotificationService, ASTrackerAPI, ASTrackerSubscriptionService) {
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

    var joinHandler = $rootScope.$on('collaboration:join', function(evt, data) {
      $log.debug('Got a join event', data);
      if (data && data.collaboration && data.collaboration.objectType) {
        var handlers = ASTrackerSubscriptionService.get(data.collaboration.objectType);

        if (!handlers || handlers.length === 0) {
          return;
        }

        handlers.forEach(function(handler) {
          try {
            handler.onJoin(data);
          } catch (e) {
            $log('Error while calling join handler', e);
          }
        });
      }
    });

    var leaveHandler = $rootScope.$on('collaboration:leave', function(evt, data) {
      $log.debug('Got a leave event', data);

      if (data && data.collaboration && data.collaboration.objectType) {
        var handlers = ASTrackerSubscriptionService.get(data.collaboration.objectType);

        if (!handlers || handlers.length === 0) {
          return;
        }

        handlers.forEach(function(handler) {
          try {
            handler.onLeave(data);
          } catch (e) {
            $log('Error while calling leave handler', e);
          }
        });
      }
    });

    $scope.$on('$destroy', function() {
      joinHandler();
      leaveHandler();
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
        if (self.notifications[streamId]) {
          return false;
        }
        var socketIORoom = livenotification('/activitystreams', streamId).on('notification', liveNotificationHandler);
        self.notifications[streamId] = socketIORoom;
        return true;
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
  }])
  .factory('ASTrackerSubscriptionService', ['$log', 'objectTypeAdapter', 'ASTrackerNotificationService', function($log, objectTypeAdapter, ASTrackerNotificationService) {
    var handlers = {};

    function joinLeaveWrapper(objectType, handler) {
      return {
        onJoin: function(data) {
          if (data.collaboration.objectType !== objectType) {
            return;
          }

          handler.get(data.collaboration.id).then(function(success) {
            var uuid = success.data.activity_stream.uuid;
            var streamInfo = objectTypeAdapter.adapt(success.data);
            streamInfo.uuid = uuid;
            streamInfo.display_name = streamInfo.displayName;
            streamInfo.href = streamInfo.url;
            streamInfo.img = streamInfo.avatarUrl;
            var registered = ASTrackerNotificationService.subscribeToStreamNotification(uuid);
            if (registered) {
              ASTrackerNotificationService.addItem(streamInfo);
            }

          }, function(err) {
            $log.debug('Error while getting collaboration', err.data);
          });
        },

        onLeave: function(data) {
          if (data.collaboration.objectType !== objectType) {
            return;
          }
          handler.get(data.collaboration.id).then(function(success) {
            var uuid = success.data.activity_stream.uuid;
            ASTrackerNotificationService.unsubscribeFromStreamNotification(uuid);
            ASTrackerNotificationService.removeItem(uuid);
          }, function(err) {
            $log.debug('Error while getting the collaboration', err.data);
          });
        }
      };
    }

    function register(objectType, handler) {
      if (!objectType || !handler) {
        return;
      }

      if (!handlers[objectType]) {
        handlers[objectType] = [];
      }
      handlers[objectType].push(joinLeaveWrapper(objectType, handler));
    }

    function get(objectType) {
      if (!objectType || !handlers[objectType]) {
        return [];
      }
      return handlers[objectType];
    }

    return {
      register: register,
      get: get
    };
  }]);

'use strict';

angular.module('esn.activitystream', [
  'restangular',
  'esn.message',
  'esn.rest.helper',
  'esn.session',
  'esn.websocket',
  'esn.notification',
  'mgcrea.ngStrap',
  'ngAnimate',
  'angularSpinner'
])
  .factory('activitystreamAPI', ['Restangular', function(Restangular) {
    function get(id, options) {
      return Restangular.all('activitystreams/' + id).getList(options);
    }
    return {
      get: get
    };
  }])

  .factory('activityStreamUpdates', ['restcursor', 'activitystreamAPI', 'messageAPI', '$q', function(restcursor, activitystreamAPI, messageAPI, $q) {
    function apiWrapper(id) {
      function api(options) {
        return activitystreamAPI.get(id, options);
      }
      return api;
    }
    function getRestcursor(id, limit, after) {
      var restcursorOptions = {
        apiArgs: {limit: limit, after: after},
        updateApiArgs: function(cursor, items, apiArgs) {
          if (items.length > 0) {
            apiArgs.after = items[(items.length - 1)]._id;
          }
        }
      };
      return restcursor(apiWrapper(id), limit, restcursorOptions);
    }


    function getMessageIndex(threads, id) {
      var messageIndex = null;
      threads.every(function(thread, index) {
        if (thread._id === id) {
          messageIndex = index;
          return false;
        }
        return true;
      });
      return messageIndex;
    }

    function removeThreadById(threads, threadId) {
      var threadIndex = getMessageIndex(threads, threadId);
      if (threadIndex !== null) {
        threads.splice(threadIndex, 1);
      }
    }

    function fetchNextTimelineEntries(cursor) {
      var defer = $q.defer();
      if (cursor.endOfStream) {
        defer.resolve();
      } else {
        cursor.nextItems(function(err, results) {
          if (err) {
            return defer.reject(err);
          }
          defer.resolve(results);
        });
      }
      return defer.promise;
    }

    function applyUpdates(uuid, $scope) {
      var cursor = getRestcursor(uuid, 30, $scope.mostRecentActivityID);

      function updateThreads(ids, timelines, $scope) {
        return messageAPI.get({'ids[]': ids}).then(function(response) {
          var msgHash = {};
          response.data.forEach(function(message) {
            msgHash[message._id] = message;
          });
          timelines.forEach(function(timelineentry) {
            $scope.mostRecentActivityID = timelineentry._id;
            removeThreadById($scope.threads, timelineentry.threadId);
            $scope.threads.unshift(msgHash[timelineentry.threadId]);
          });
          return nextRound();
        });
      }

      function onTimelineEntries(items) {
        if (!items || !items.length) {
          return $q.when(true);
        }

        var ids = [], timelines = [];

        items.forEach(function(timelineentry) {
          var isComment = timelineentry.inReplyTo && timelineentry.inReplyTo.length;
          var threadId = isComment ? timelineentry.inReplyTo[0]._id : timelineentry.object._id;
          if (ids.indexOf(threadId) < 0) {
            ids.push(threadId);
          }
          timelineentry.threadId = threadId;
          timelines.push(timelineentry);
        });

        return updateThreads(ids, timelines, $scope);
      }

      function nextRound() {
        return fetchNextTimelineEntries(cursor).then(onTimelineEntries);
      }

      return nextRound();
    }

    return applyUpdates;
  }])

  .factory('activitystreamFilter', function() {

    return function() {
      var sent = {}, removed = {};

      function addToSentList(id) {
        sent[id] = true;
      }

      function addToRemovedList(id) {
        removed[id] = true;
      }

      function filter(item) {
        var messageId = item.object._id;
        var rootMessageId = item.inReplyTo && item.inReplyTo.length ? item.inReplyTo[0]._id : item.object._id;
        if (sent[rootMessageId] || removed[rootMessageId]) {
          return false;
        }
        if (item.verb === 'remove' && messageId === rootMessageId) {
          addToRemovedList(rootMessageId);
          return false;
        }
        addToSentList(rootMessageId);
        return true;
      }

      return {
        filter: filter,
        addToSentList: addToSentList,
        addToRemovedList: addToRemovedList
      };
    };

  })

  .factory('activitystreamMessageDecorator', ['messageAPI', function(messageAPI) {
    return function activitystreamMessageDecorator(callback) {
      return function(err, items) {
        if (err) {
          return callback(err);
        }
        if (items.length === 0) {
          return callback(null, []);
        }
        var messageIds = [], itemMessageIds = [];
        items.forEach(function(item) {
          var id = item.inReplyTo && item.inReplyTo.length ? item.inReplyTo[0]._id : item.object._id;
          messageIds.push(id);
          itemMessageIds.push({id: id, item: item});
        });
        messageAPI.get({'ids[]': messageIds}).then(function(response) {
          var msgHash = {};
          var errors = [];
          response.data.forEach(function(message) {
            if (!message.objectType) {
              errors.push(message);
            }
            msgHash[message._id] = message;
          });

          if (errors.length) {
            var e = { code: 400, message: 'message download failed', details: errors};
            return callback(e);
          }

          itemMessageIds.forEach(function(imi) {
            imi.item.object = msgHash[imi.id];
          });

          callback(null, items);

        }, function(response) {
          callback(response.data);
        });
      };
    };
  }])

  .factory(
  'activitystreamAggregator',
  ['activitystreamFilter', 'filteredcursor', 'restcursor', 'activitystreamMessageDecorator', 'activitystreamAPI',
    function(activitystreamFilter, filteredcursor, restcursor, activitystreamMessageDecorator, activitystreamAPI) {

      function apiWrapper(id) {
        function api(options) {
          return activitystreamAPI.get(id, options);
        }
        return api;
      }

      function getRestcursor(id, limit) {
        var restcursorOptions = {
          apiArgs: {limit: limit},
          updateApiArgs: function(cursor, items, apiArgs) {
            if (items.length > 0) {
              apiArgs.before = items[(items.length - 1)]._id;
            }
          }
        };
        return restcursor(apiWrapper(id), limit, restcursorOptions);
      }

      function activitystreamAggregator(id, limit) {

        var restcursorlimit = limit * 3;
        var restcursorinstance = getRestcursor(id, restcursorlimit);

        var filter = activitystreamFilter();

        var filteredcursorOptions = { filter: filter.filter };
        var filteredcursorInstance = filteredcursor(restcursorinstance, limit, filteredcursorOptions);

        function loadMoreElements(callback) {
          filteredcursorInstance.nextItems(activitystreamMessageDecorator(callback));
        }

        var aggregator = {
          filter: filter,
          cursor: filteredcursorInstance,
          loadMoreElements: loadMoreElements
        };
        aggregator.__defineGetter__('endOfStream', function() { return filteredcursorInstance.endOfStream; });

        return aggregator;
      }

      return activitystreamAggregator;
    }])
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
      restrict: 'E',
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
        replace: true,
        templateUrl: '/views/modules/activitystream/activitystream.html',
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
    }])

  .controller('activitystreamController',
  ['$rootScope', '$scope', 'activitystreamAggregator', 'usSpinnerService', '$alert', 'activityStreamUpdates',
    function($rootScope, $scope, aggregatorService,  usSpinnerService, alert, activityStreamUpdates) {

      var spinnerKey = 'activityStreamSpinner', aggregator;

      $scope.displayError = function(err) {
        alert({
          content: err,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '#activitystreamerror',
          duration: '3',
          animation: 'am-fade'
        });
      };

      $scope.reset = function() {
        $scope.restActive = false;
        $scope.threads = [];
        $scope.mostRecentActivityID = null;
        aggregator = null;
      };

      $scope.reset();

      $scope.getStreamUpdates = function() {
        if ($scope.restActive) {
          return;
        }
        $scope.restActive = true;
        $scope.updates = [];
        activityStreamUpdates($scope.activitystreamUuid, $scope).then(function() {
        }, function(err) {
        }).finally (function() {
          // we have to plug here the throbber once the websocket stuff is on
          $scope.restActive = false;
          $rootScope.$emit('activitystream:updated', {
            activitystreamUuid: $scope.activitystreamUuid
          });
        });
      };

      $scope.threads.push({
          body: {
            text: 'Ceci est un message automatique.',
            html: '<strong>Ceci est un message automatique.</strong>'
          },
          from: 'Stephen Le Maistre <slemaistre@linagora.com>',
          to: 'Laurent Dubois <ldubois@linagora.com>',
          cc: 'mbailly@linagora.com',
          subject: '[Openpaas] Hey ! It is a new email from OpenPaas',
          objectType: 'email',
          published: new Date('2014-09-11T08:16:44.312Z'),
          author: {
            __v: 21,
            _id: '538f3e70e89c3c985e6c0ba2',
            currentAvatar: '5fe1f2c0-10f6-11e4-b626-01515edcb70d',
            firstname: 'Stephen',
            lastname: 'Le Maistre',
            password: '$2a$05$b1oz8Q33.zLDXPXaFWEqtufUVfWJQfRcSAmnaio4FEa/YGpVmMQ8C',
            avatars: [
              '9541fed0-f600-11e3-a40e-9f1bea318feb',
              '27b86b20-fc44-11e3-830a-47dc9ad0ddb4',
              '377691e0-fc44-11e3-830a-47dc9ad0ddb4',
              '7a2ec7f0-fc7b-11e3-b011-c90b46059c7d',
              '5fe1f2c0-10f6-11e4-b626-01515edcb70d'
            ],
            schemaVersion: 1,
            login: {
              success: new Date('2014-09-09T13:37:25.490Z'),
              failures: []
            },
            domains: [
              {
                domain_id: '538f494eb68ade0d0826f8a2',
                joined_at: new Date('2014-06-04T15:42:40.480Z')
              }
            ],
            timestamps: {
              creation: new Date('2014-06-04T15:42:40.387Z')
            },
            emails: [
              'usera@linagora.com'
            ]
          }
        });

      function updateMessageList() {
        if ($scope.restActive) {
          return;
        }
        $scope.restActive = true;
        usSpinnerService.spin(spinnerKey);

        aggregator.loadMoreElements(function(error, items) {
          if (error) {
            $scope.displayError('Error while retrieving messages. ' + error);
          }
          else {
            for (var i = 0; i < items.length; i++) {
              if (!$scope.mostRecentActivityID) {
                $scope.mostRecentActivityID = items[i]._id;
              }
              $scope.threads.push(items[i].object);
            }
          }
          $scope.restActive = false;
          usSpinnerService.stop(spinnerKey);
        });
      }

      $scope.loadMoreElements = function() {
        if (!$scope.activitystreamUuid) {
          return;
        }
        if (!aggregator) {
          aggregator = aggregatorService($scope.activitystreamUuid, 25);
        }
        if (!aggregator.endOfStream) {
          updateMessageList();
        }
      };

      $rootScope.$on('activitystream:userUpdateRequest', function(evt, data) {
        if ($scope.activitystreamUuid === data.activitystreamUuid) {
          $scope.getStreamUpdates();
        }
      });
    }]);

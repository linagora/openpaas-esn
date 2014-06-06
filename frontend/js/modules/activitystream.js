'use strict';

angular.module('esn.activitystream', [
  'restangular',
  'esn.message',
  'esn.rest.helper',
  'esn.session',
  'esn.websocket',
  'mgcrea.ngStrap',
  'ngAnimate',
  'angularSpinner',
  'ui.notify'
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

.directive('activityStream', ['messageAPI', '$rootScope', '$timeout', function(messageAPI, $rootScope, $timeout) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/activitystream/activitystream.html',
      link: function(scope, element, attrs) {
        scope.activitystreamUuid = attrs.activitystreamUuid;
        var currentActivitystreamUuid = scope.activitystreamUuid;

        function onMessagePosted(evt, msgMeta) {
          if (msgMeta.activitystreamUuid !== scope.activitystreamUuid) {
            return;
          }
          if (scope.restActive) {
            return;
          }
          scope.getStreamUpdates();
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
          }
        }
        //initialization code

        // let sub-directives load and register event listeners
        // before we start fetching the stream
        $timeout(function() {
          scope.loadMoreElements();
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
  ['$scope', 'activitystreamAggregator', 'usSpinnerService', '$alert', 'activityStreamUpdates',
  function($scope, aggregatorService,  usSpinnerService, alert, activityStreamUpdates) {

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
      });
    };

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
  }])

  .directive('activitystreamNotification', ['livenotification', 'notificationService', '$timeout', 'session',
                                            function(livenotification, notificationService, $timeout, session) {
    return {
      restrict: 'A',
      controller: function($scope) {
        // This is the way pNotify works. We have to declare the stack
        // variable outside of the instanciation because pNotify stocks the
        // state of notifications here.
        var stack_bottomright = {'dir1': 'up', 'dir2': 'left', 'push': 'top'};
        function handleNotification(msg) {
          $scope.updates = $scope.updates || [];
          $scope.updates.push(msg);
          notificationService.notify({
            title: 'Activity Stream updated',
            text: msg.actor.displayName + ' added a message on ' + new Date(msg.published),
            nonblock: {
              nonblock: true,
              nonblock_opacity: 0.2
            },
            addclass: 'stack-bottomright',
            stack: stack_bottomright,
            type: 'info',
            delay: 3000,
            styling: 'fontawesome'
          });
        }

        $timeout(function() {
          livenotification
            .of('/activitystreams')
            .subscribe($scope.activitystreamUuid)
            .onNotification(function(msg) {
              if (msg.actor && msg.actor._id !== session.user._id) {
                handleNotification(msg);
              }
            });
          },0);
      }
    };
  }]);

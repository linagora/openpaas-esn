'use strict';

angular.module('esn.activitystream', ['restangular', 'esn.message', 'esn.rest.helper', 'esn.session', 'mgcrea.ngStrap', 'ngAnimate'])
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

  .directive('activityStream', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/activitystream/activitystream.html'
    };
  })

  .controller('activitystreamController', ['$scope', 'session', 'activitystreamAggregator', 'usSpinnerService', '$alert',
    function($scope, session, aggregatorService,  usSpinnerService, alert) {

    var spinnerKey = 'activityStreamSpinner';
    $scope.restActive = false;
    $scope.threads = [];

    var aggregator = aggregatorService(session.domain.activity_stream.uuid, 25);

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

    var updateMessageList = function() {
      if ($scope.restActive) {
        return;
      }
      else {
        $scope.restActive = true;
        usSpinnerService.spin(spinnerKey);

        aggregator.loadMoreElements(function(error, items) {
          if (error) {
            $scope.displayError('Error while retrieving messages. ' + error);
          }
          else {
            for (var i = 0; i < items.length; i++) {
              $scope.threads.push(items[i].object);
            }
          }
          $scope.restActive = false;
          usSpinnerService.stop(spinnerKey);
        });
      }
    };

    $scope.loadMoreElements = function() {
      if (!aggregator.endOfStream) {
        updateMessageList();
      }
    };

    //initialization code
    updateMessageList();
  }]);

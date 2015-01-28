'use strict';

angular.module('esn.activitystream')
.factory('activitystreamAPI', ['Restangular', function(Restangular) {
  function get(id, options) {
    return Restangular.all('activitystreams/' + id).getList(options);
  }

  function getResource(id) {
    return Restangular.all('activitystreams/' + id).one('resource').get();
  }

  return {
    get: get,
    getResource: getResource
  };
}])

.factory('activityStreamUpdates', ['restcursor', 'activitystreamAPI', 'activitystreamOriginDecorator', '$q', function(restcursor, activitystreamAPI, activitystreamOriginDecorator, $q) {
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

  function applyUpdates(uuid, $scope) {
    var cursor = getRestcursor(uuid, 30, $scope.mostRecentActivityID);

    function updateThreads(timelines, $scope) {
      timelines.forEach(function(timelineentry) {
        $scope.mostRecentActivityID = timelineentry._id;
        removeThreadById($scope.threads, timelineentry.threadId);
        $scope.threads.unshift(timelineentry.object);
      });
      return nextRound();
    }

    function fetchNextTimelineEntries(cursor) {
      var defer = $q.defer();
      if (cursor.endOfStream) {
        defer.resolve();
      } else {
        cursor.nextItems(activitystreamOriginDecorator($scope.activitystream, $scope.streams, function(err, results) {
          if (err) {
            return defer.reject(err);
          }
          defer.resolve(results);
        }));
      }
      return defer.promise;
    }

    function onTimelineEntries(items) {
      if (!items || !items.length) {
        return $q.when(true);
      }

      var timelines = [];

      items.forEach(function(timelineentry) {
        var isComment = timelineentry.inReplyTo && timelineentry.inReplyTo.length;
        var threadId = isComment ? timelineentry.inReplyTo[0]._id : timelineentry.object._id;
        timelineentry.threadId = threadId;
        timelines.push(timelineentry);
      });

      return updateThreads(timelines, $scope);
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

      }, function(error) {
        callback(error.data);
      });
    };
  };
}])

.factory(
'activitystreamAggregator',
['activitystreamFilter', 'filteredcursor', 'restcursor', 'activitystreamOriginDecorator', 'activitystreamAPI',
  function(activitystreamFilter, filteredcursor, restcursor, activitystreamOriginDecorator, activitystreamAPI) {

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

    function activitystreamAggregator(activitystream, streamOrigin, streams, limit) {
      var id = activitystream.activity_stream.uuid;

      var restcursorlimit = limit * 3;
      var restcursorinstance = getRestcursor(id, restcursorlimit);

      var filter = activitystreamFilter();

      var filteredcursorOptions = { filter: filter.filter };
      var filteredcursorInstance = filteredcursor(restcursorinstance, limit, filteredcursorOptions);

      function loadMoreElements(callback) {
        filteredcursorInstance.nextItems(activitystreamOriginDecorator(streamOrigin, streams, callback));
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
  }]
).factory('activitystreamsAggregator', ['$q', '$log', function($q, $log) {

  function activitystreamsAggregator(aggs, rpp) {
    var aggregators = aggs.map(function(agg) {
      return {aggregator: agg, items: [], runningPromise: null};
    });

    function isEndOfStream() {
      var end = 0;
      aggregators.forEach(function(obj) {
        if (obj.aggregator.endOfStream) {
          end++;
        }
      });
      return end === aggregators.length;
    }

    function _loadMoreElement(obj) {
      if (obj.items.length >= rpp || obj.aggregator.endOfStream) {
        return $q.when(true);
      }

      if (!obj.runningPromise) {
        var defer = $q.defer();
        obj.aggregator.loadMoreElements(function(err, items) {
          obj.runningPromise = null;
          if (err) {
            return defer.reject(err);
          } else {
            obj.items = obj.items.concat(items);
            return defer.resolve(true);
          }
        });
        obj.runningPromise = defer.promise;
      }
      return obj.runningPromise;
    }

    function _loadAllMoreElements() {
      var jobs = aggregators.map(function(obj) {
        return _loadMoreElement(obj);
      });
      return $q.all(jobs);
    }

    function _getMostRecent() {
      var mostRecent = null;
      aggregators.forEach(function(obj) {
        if (obj.items.length === 0) {
          return;
        }
        if (!mostRecent) {
          mostRecent = obj;
        } else {
          var selected = mostRecent.items[0].published;
          var candidate = obj.items[0].published;
          if (Date.parse(candidate) > Date.parse(selected)) {
            mostRecent = obj;
          }
        }
      });

      if (mostRecent) {
        return mostRecent.items.shift();
      }
    }

    function _getXMostRecent(count) {
      var response = [];
      for (var i = 0; i < count; i++) {
        var item = _getMostRecent();
        if (item) {
          response.push(item);
        }
      }
      return response;
    }

    function loadMoreElements(callback) {
      if (isEndOfStream()) {
        return callback();
      }
      _loadAllMoreElements().then(function() {
          callback(null, _getXMostRecent(rpp));
        },
        function(err) {
          return callback(err);
        });
    }

    var aggregator = {
      loadMoreElements: loadMoreElements
    };

    aggregator.__defineGetter__('endOfStream', isEndOfStream);
    return aggregator;
  }

  return activitystreamsAggregator;
}])
.factory('activitystreamAggregatorCreator', ['activitystreamAggregator', 'activitystreamsAggregator', function(activitystreamAggregator, activitystreamsAggregator) {

  function one(activitystream, streamOrigin, streams, limit) {
    return activitystreamAggregator(activitystream, streamOrigin, streams, limit);
  }

  function many(streamOrigin, streams, limit) {
    var aggs = streams.map(function(stream) {
      return one(stream, streamOrigin, streams, limit);
    });
    return activitystreamsAggregator(aggs, limit);
  }

  return function(streamOrigin, streams, limit) {
    if (!streams || streams.length === 0) {
      return one(streamOrigin, streamOrigin, streams, limit);
    } else {
      return many(streamOrigin, streams, limit);
    }
  };
}])
.factory('activitystreamOriginDecorator', ['activitystreamMessageDecorator', 'activitystreamHelper', function(activitystreamMessageDecorator, activitystreamHelper) {
  return function activitystreamOriginDecorator(streamOrigin, streams, callback) {

    function getStreamOrigins(message) {
      if (!message || !angular.isArray(streams)) {
        return [];
      }

      return streams.filter(function(stream) {
        return message.target && message.target.some(function(target) {
            return target.objectType === 'activitystream' && target._id === stream.activity_stream.uuid;
          });
      });
    }

    function isOriginMessage(message) {
      return message.target && message.target.some(function(target) {
          return target.objectType === 'activitystream' && target._id === streamOrigin.activity_stream.uuid;
        });
    }

    function getMainActivityStream(message) {
      if (isOriginMessage(message)) {
        return streamOrigin;
      }
      return getStreamOrigins(message)[0];
    }

    return activitystreamMessageDecorator(function(err, items) {
        if (items) {
          items = items.map(function(item) {
            item.object.streamOrigins = getStreamOrigins(item);
            item.object.isOrigin = isOriginMessage(item);
            item.object.mainActivityStream = getMainActivityStream(item);
            return item;
          });
        }
        return callback(err, items);
      });
    };
}])
.factory('activitystreamHelper', function(session, companyUserService) {

  function getMessageStreamOrigins(message, streams) {
    if (!message || !angular.isArray(streams)) {
      return [];
    }

    return streams.filter(function(stream) {
      return message.shares && message.shares.some(function(share) {
        return share.objectType === 'activitystream' && share.id === stream.activity_stream.uuid;
      });
    });
  }

  function messageIsSharedInStreams(message, streams) {
    return getMessageStreamOrigins(message, streams).length > 0;
  }

  function isMessageReadableForUser(timelineentry) {
    var currentUserEmail = session.user.emails[0];

    if (companyUserService.isInternalUser(currentUserEmail, session.domain.company_name)) {
      return true;
    }

    var isAMessageRecipient = false;
    if (timelineentry.to && angular.isArray(timelineentry.to) && timelineentry.to.length > 0) {
      isAMessageRecipient = timelineentry.to.some(function(recipient) {
        if (recipient && recipient.objectType) {
          if (recipient.objectType === 'company') {
            return companyUserService.isInternalUser(currentUserEmail, recipient.id);
          }
          return false;
        }
        return false;
      });
    }
    return isAMessageRecipient;
  }

  return {
    messageIsSharedInStreams: messageIsSharedInStreams,
    getMessageStreamOrigins: getMessageStreamOrigins,
    isMessageReadableForUser: isMessageReadableForUser
  };
});

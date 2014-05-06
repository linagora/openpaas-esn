'use strict';

angular.module('esn.activitystream', ['restangular', 'esn.message', 'esn.rest.helper'])
.factory('activitystreamAPI', ['Restangular', function(Restangular) {
  function get(id, options) {
    return Restangular.all('activitystreams/' + id).getList(options);
  }
  return {
    get: get
  };
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
      if (sent[item.object._id] || removed[item.object._id]) {
        return false;
      }
      if (item.verb === 'remove') {
        addToRemovedList(item.object._id);
        return false;
      }
      addToSentList(item.object._id);
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
      var messageIds = items.map(function(item) {return item.object._id;});
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

        items.forEach(function(item) {
          item.object = msgHash[item.object._id];
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
        apiArgs.before = items[(items.length - 1)]._id;
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
}]);

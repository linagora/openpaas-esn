'use strict';

angular.module('esn.activitystream', ['restangular', 'esn.message'])
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
}]);

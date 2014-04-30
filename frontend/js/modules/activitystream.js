'use strict';

angular.module('esn.activitystream', ['restangular'])
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


});

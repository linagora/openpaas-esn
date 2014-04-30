'use strict';

angular.module('esn.activitystream', ['restangular'])
.factory('activitystreamAPI', ['Restangular', function(Restangular) {
  function get(id, options) {
    return Restangular.all('activitystreams/' + id).getList(options);
  }
  return {
    get: get
  };
}]);

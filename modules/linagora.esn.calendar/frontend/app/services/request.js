(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('request', requestFactory);

  function requestFactory($http, $q, DAV_PATH) {
    return request;

    ////////////

    function request(method, path, headers, body, params) {
      return _configureRequest(method, path, headers, body, params).then($http);
    }

    function _ensurePathToProxy(path) {
      return path.substring(path.indexOf('/calendars'), path.length);
    }

    function _configureRequest(method, path, headers, body, params) {
      var url = DAV_PATH;

      headers = headers || {};

      var config = {
        url: url + _ensurePathToProxy(path),
        method: method,
        headers: headers,
        params: params
      };

      if (body) {
        config.data = body;
      }

      return $q.when(config);
    }
  }

})();

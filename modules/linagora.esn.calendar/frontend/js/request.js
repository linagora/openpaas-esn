'use strict';

angular.module('esn.calendar')

  .factory('calendarRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/api/calendars');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('request', function($http, $q, DAV_PATH) {
    function ensurePathToProxy(path) {
      return path.substring(path.indexOf('/calendars'), path.length);
    }

    function _configureRequest(method, path, headers, body, params) {
      var url = DAV_PATH;

      headers = headers || {};

      var config = {
        url: url + ensurePathToProxy(path),
        method: method,
        headers: headers,
        params: params
      };

      if (body) {
        config.data = body;
      }

      return $q.when(config);
    }

    function request(method, path, headers, body, params) {
      return _configureRequest(method, path, headers, body, params).then($http);
    }

    return request;
  });

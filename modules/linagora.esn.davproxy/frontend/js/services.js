'use strict';

angular.module('linagora.esn.davproxy')
  .factory('davClient', function($http, $q, httpConfigurer, DAV_PATH) {
    function davClient(method, path, headers, body, params) {
      var config = {
        url: httpConfigurer.getUrl(DAV_PATH.replace(/\/$/, '') + path),
        method: method,
        headers: headers || {},
        params: params
      };

      if (body) {
        config.data = body;
      }

      return $http(config);
    }

    return davClient;
  });

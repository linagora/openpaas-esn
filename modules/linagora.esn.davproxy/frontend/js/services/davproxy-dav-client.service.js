(function(angular) {
  angular.module('linagora.esn.davproxy')
    .factory('davClient', davClient);

  function davClient($http, httpConfigurer, DAV_PATH) {
    return davClient;

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
  }
})(angular);

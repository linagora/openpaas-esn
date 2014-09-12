angular.module('esn.maps', ['ngGeolocation'])
  .factory('geoAPI', ['$http', '$geolocation', function($http, $geolocation) {

    function getCurrentPosition() {
      return $geolocation.getCurrentPosition();
    }

    function reverse(latitude, longitude, config) {
      config = config || {};
      config.method = config.method || 'GET';
      config.headers = config.headers || {};
      config.url = 'http://nominatim.openstreetmap.org/reverse';
      config.params = {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      };
      return $http(config);
    }

    return {
      reverse: reverse,
      getCurrentPosition: getCurrentPosition
    };
  }]
);
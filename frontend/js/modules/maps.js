'use strict';

angular.module('esn.maps', ['ngGeolocation', 'leaflet-directive'])
  .factory('osmAPI', ['$http', function($http) {

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
      reverse: reverse
    };
  }])
  .factory('geoAPI', ['$window', '$geolocation', 'osmAPI', function($window, $geolocation, osmAPI) {

    function supported() {
      return 'geolocation' in $window.navigator;
    }

    function getCurrentPosition() {
      return $geolocation.getCurrentPosition();
    }

    function reverse(latitude, longitude, config) {
      return osmAPI.reverse(latitude, longitude, config);
    }

    return {
      supported: supported,
      reverse: reverse,
      getCurrentPosition: getCurrentPosition
    };
  }])
  .directive('mapGetDisplayCurrentPosition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/maps/getDisplayCurrentPosition.html'
    };
  })
  .directive('displayPosition', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        position: '='
      },
      templateUrl: '/views/modules/maps/displayPosition.html',
      controller: 'mapDisplayController'
    };
  })
  .directive('fillPosition', ['geoAPI', function(geoAPI) {
    return {
      restrict: 'A',
      link: function($scope, elem) {

        $scope.fillPosition = function() {
          $scope.position.load = true;
          $scope.position.show = true;
          geoAPI.getCurrentPosition().then(function(data) {
            $scope.position.coords = data.coords;
            $scope.position.message = 'Latitude: ' + data.coords.latitude + ', Longitude: ' + data.coords.longitude;
            geoAPI.reverse(data.coords.latitude, data.coords.longitude).then(function(data) {
              $scope.position.message = data.data.display_name || $scope.position.message;
              $scope.position.display_name = data.data.display_name;
            }, function(err) {
            }).finally (function() {
              $scope.position.load = false;
            });
          }, function(err) {
            $scope.position.error = true;
            if (err.error.code === 1) {
              $scope.position.denied = true;
            }
            if (err.error.code === 2) {
              $scope.position.unavailable = true;
            }
          }).finally (function() {
            $scope.position.load = false;
          });
        };

        $scope.removePosition = function() {
          $scope.position = {};
        };

        elem.bind('click', function() {
          $scope.fillPosition();
        });
      }
    };
  }])
  .controller('mapDisplayController', function($scope) {

    angular.extend($scope, {
      defaults: {
        scrollWheelZoom: false
      }, center: {
        lat: 48.8534100,
        lng: 2.3488000,
        zoom: 10
      }
    });

    $scope.showMeMap = false;

    $scope.toggleMapDisplay = function(position) {
      if (!position) {
        return;
      }

      $scope.showMeMap = !$scope.showMeMap;

      $scope.markers = {
        me: {
          focus: true,
          draggable: false,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

      $scope.center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        zoom: 16
      };

    };
  });

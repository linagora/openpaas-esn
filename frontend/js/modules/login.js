'use strict';

angular.module('esn.login', ['restangular'])
  .controller('login', function($scope, $window) {
    $scope.login = function(username, password) {
      if (username === password) {
        $window.location.href = '/logged';
      }
    };

  })
  .factory('loginAPI', ['Restangular', function(Restangular) {

    function get() {
      return true;
    }

    return {
      get: get
    };
  }]);

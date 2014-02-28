'use strict';

angular.module('esn.login', ['restangular'])
  .controller('login', function($scope, loginAPI) {
    $scope.login = function() {
      var credentials = {
        username: $scope.username,
        password: $scope.password
      };
      loginAPI.login(credentials).then(function() {});
    };

  })
  .factory('loginAPI', ['Restangular', function(Restangular) {

    Restangular.setBaseUrl('/');

    function login(credentials) {
      return Restangular.one('login').post('', credentials);
    }

    return {
      login: login
    };

  }]);

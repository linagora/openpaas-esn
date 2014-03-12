'use strict';

angular.module('esn.login', ['restangular'])
  .controller('login', function($scope, $location, $window, loginAPI) {
    $scope.credentials = {username: '', password: '', rememberme: false};
    $scope.loginButton = {
      label: 'Sign In',
      notRunning: 'Sign In',
      running: 'Please Wait...'
    };
    $scope.loginTask = {
      running: false
    };

    $scope.login = function() {
      if ($scope.form.$invalid) {
        return;
      }

      $scope.loginTask.running = true;
      $scope.loginButton.label = $scope.loginButton.running;

      loginAPI.login($scope.credentials).then(
        function(data) {
          $scope.loginTask.running = false;
          $window.location.href = '/';
          return data;
        },
        function(err) {
          $scope.loginButton.label = $scope.loginButton.notRunning;
          $scope.loginTask.running = false;
          $location.path('/login');
          $scope.error = {
            status: 'error',
            details: err
          };
          return $scope.error;
        }
      );
    };
  })
  .factory('loginAPI', ['Restangular', function(Restangular) {

    Restangular.setBaseUrl('/api');

    function login(credentials) {
      return Restangular.one('login').post('', credentials);
    }

    return {
      login: login
    };

  }]);

'use strict';

angular.module('esn.login', ['restangular'])
  .controller('login', function($scope, $location, $window, loginAPI, loginErrorService) {
    $scope.loginIn = false;
    $scope.credentials = loginErrorService.getCredentials() || {username: '', password: '', rememberme: false};
    $scope.error = loginErrorService.getError();

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
          $scope.loginIn = true;
          $scope.loginTask.running = false;
          $window.location.href = '/';
        },
        function(err) {
          $scope.loginButton.label = $scope.loginButton.notRunning;
          $scope.loginTask.running = false;
          $scope.error = err.data;
          loginErrorService.set($scope.credentials, err.data);
          $location.path('/login');
        }
      );
    };

    $scope.showError = function() {
      return loginErrorService.getError() && $location.path() !== '/' && !$scope.loginTask.running && !$scope.loginIn;
    };
  })
  .factory('loginAPI', ['Restangular', function(Restangular) {

    function login(credentials) {
      return Restangular.one('login').post('', credentials);
    }

    return {
      login: login
    };

  }])
  .service('loginErrorService', function($rootScope, $location) {
    this.data = {};

    var self = this;
    $rootScope.$on('$routeChangeSuccess', function() {
      if ($location.path() === '/') {
        self.data = {};
      }
    });

    this.set = function(credentials, error) {
      this.data.credentials = credentials;
      this.data.error = error;
    };

    this.getData = function() {
      return this.data;
    };

    this.getCredentials = function() {
      return this.data.credentials;
    };

    this.getError = function() {
      return this.data.error;
    };
  });


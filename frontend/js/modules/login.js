'use strict';

angular.module('esn.login', ['restangular', 'vcRecaptcha'])
  .directive('esnLoginAutofill', function() {
    return {
      restrict: 'A',
      link: function(scope, element) {
        scope.autofill = function() {
          element.find('input').each(function() {
            var $this = angular.element(this);
            if ($this.attr('ng-model') && $this.attr('type') !== 'checkbox') {
              angular.element(this).controller('ngModel').$setViewValue($this.val());
            }
          });
        };
      }
    };
  })
  .controller('login', function($scope, $location, $window, loginAPI, loginErrorService, vcRecaptchaService) {
    $scope.loginIn = false;
    $scope.recaptcha = {
      needed: false,
      data: null
    };
    $scope.credentials = loginErrorService.getCredentials() || {username: '', password: '', rememberme: false};
    $scope.credentials.recaptcha = $scope.recaptcha;
    $scope.error = loginErrorService.getError();
    $scope.autocomplete = ($location.path() === '/') ? 'on' : 'off';

    $scope.loginButton = {
      label: 'Sign In',
      notRunning: 'Sign In',
      running: 'Please wait...'
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

          $window.location.reload();
        },
        function(err) {
          $scope.loginButton.label = $scope.loginButton.notRunning;
          $scope.loginTask.running = false;
          $scope.error = err.data;
          $scope.credentials.password = '';
          loginErrorService.set($scope.credentials, err.data);
          $location.path('/login');
          $scope.recaptcha.needed = err.data.recaptcha || false;
          try {
            vcRecaptchaService.reload();
          } catch (e) {}
        }
      );
    };

    $scope.showError = function() {
      return loginErrorService.getError() && $location.path() !== '/' && !$scope.loginTask.running && !$scope.loginIn;
    };
  })
  .factory('loginAPI', ['Restangular', function(Restangular) {

    function login(credentials) {
      return Restangular.all('login').post(credentials);
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


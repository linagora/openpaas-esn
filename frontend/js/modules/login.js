'use strict';

angular.module('esn.login', ['esn.notification', 'esn.http', 'vcRecaptcha'])
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
  .controller('login', function($scope, $log, $location, $window, loginAPI, loginErrorService, vcRecaptchaService, notificationFactory) {
    $scope.step = 1;
    $scope.loginIn = false;
    $scope.recaptcha = {
      needed: false,
      data: null
    };
    $scope.credentials = loginErrorService.getCredentials() || {username: '', password: '', rememberme: false};
    $scope.credentials.recaptcha = $scope.recaptcha;
    $scope.error = loginErrorService.getError();
    $scope.autocomplete = ($location.path() === '/') ? 'on' : 'off';

    $scope.loginTask = {
      running: false
    };

    $scope.login = function(form) {
      if (form.$invalid) {
        return;
      }

      $scope.loginTask.running = true;

      loginAPI.login($scope.credentials).then(
        function() {
          $scope.loginIn = true;
          $scope.loginTask.running = false;
          $window.location.reload();
        },
        function(err) {
          $scope.loginTask.running = false;
          $scope.error = err.data;
          $scope.credentials.password = '';
          loginErrorService.set($scope.credentials, err.data);
          notificationFactory.weakError('Login error', 'Please check your credentials');
          $scope.recaptcha.needed = err.data.recaptcha || false;
          try {
            vcRecaptchaService.reload();
          } catch (e) {
            $log.error(e);
          }
        }
      );
    };

    $scope.isLogin = true;
    $scope.isRegister = false;
    $scope.tab = function(tabNumber) {
      if ($scope.step !== tabNumber) {
        $scope.step = tabNumber;
        $scope.isLogin = $scope.step === 1;
        $scope.isRegister = $scope.step === 2;
      }
    };

    $scope.showError = function() {
      return loginErrorService.getError() && $location.path() !== '/' && !$scope.loginTask.running && !$scope.loginIn;
    };
  })
  .controller('forgotPassword', function($scope, loginAPI) {
    $scope.email = '';
    $scope.running = false;
    $scope.hasFailed = false;
    $scope.hasSucceeded = false;

    $scope.resetPassword = function(form) {
      if (form.$invalid) {
        return;
      }

      $scope.running = true;
      loginAPI.askForPasswordReset($scope.email).then(
        function(response) {
          $scope.running = false;
          $scope.hasSucceeded = true;
          $scope.hasFailed = false;
        },
        function(err) {
          $scope.running = false;
          $scope.hasSucceeded = false;
          $scope.hasFailed = true;
        }
      );
    };
  })
  .factory('loginAPI', function(esnRestangular) {

    function login(credentials) {
      return esnRestangular.all('login').post(credentials);
    }

    function askForPasswordReset(email) {
      return esnRestangular.all('passwordreset').post({email: email});
    }

    function updatePassword(password, jwtToken) {
      return esnRestangular.one('passwordreset').customPUT({password: password}, undefined, {jwt: jwtToken});
    }

    return {
      login: login,
      askForPasswordReset: askForPasswordReset,
      updatePassword: updatePassword
    };

  })
  .service('loginErrorService', function($rootScope, $location) {
    this.data = {};

    var self = this;
    $rootScope.$on('$stateChangeSuccess', function() {
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

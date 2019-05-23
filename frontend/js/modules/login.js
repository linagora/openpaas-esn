'use strict';

angular.module('esn.login', ['esn.notification', 'esn.http', 'op.dynamicDirective', 'esn.feature-registry'])
  .config(function(dynamicDirectiveServiceProvider) {
    var passwordControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'controlcenter-menu-password', {priority: -14});

    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', passwordControlCenterMenu);
  })
  .run(function(esnFeatureRegistry) {
    esnFeatureRegistry.add({
      name: 'Password',
      configurations: [{
        displayIn: 'Control Center',
        name: 'control-center:password'
      }],
      description: 'Allows users to change their password'
    });
  })
  .directive('controlcenterMenuPassword', function(controlCenterMenuTemplateBuilder) {
    return {
      retrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.changepassword', 'mdi-lock', 'Password', 'core.features.control-center:password')
    };
  })
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
  .controller('login', function(
    $scope,
    $log,
    $location,
    loginAPI,
    esnLoginSuccessService,
    loginErrorService,
    notificationFactory,
    dynamicDirectiveService,
    RESET_PASSWORD_ENABLED) {
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
    $scope.signupIsEnabled = dynamicDirectiveService.getInjections('esn-signup-form').length > 0;
    $scope.RESET_PASSWORD_ENABLED = RESET_PASSWORD_ENABLED;

    $scope.loginTask = {
      running: false
    };

    $scope.login = function(form) {
      if (form.$invalid) {
        return;
      }

      $scope.loginTask.running = true;

      loginAPI.login($scope.credentials).then(function() {
        $scope.loginIn = true;
        $scope.loginTask.running = false;
      })
      .then(esnLoginSuccessService)
      .catch(function(err) {
        $scope.loginTask.running = false;
        $scope.error = err.data;
        $scope.credentials.password = '';
        loginErrorService.set($scope.credentials, err.data);
        if (err.data.error && err.data.error.details && err.data.error.details.match(/The specified account is disabled/)) {
          notificationFactory.weakError('Login disabled', 'This account has been disabled');
        } else {
          notificationFactory.weakError('Login error', 'Please check your credentials');
        }
      });
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
    $scope.input = {};
    $scope.running = false;
    $scope.hasFailed = false;
    $scope.hasSucceeded = false;

    $scope.resetPassword = function(form) {
      if (form.$invalid) {
        return;
      }

      $scope.running = true;

      return loginAPI.askForPasswordReset($scope.input.email).then(
        function() {
          $scope.running = false;
          $scope.hasSucceeded = true;
          $scope.hasFailed = false;
        },
        function() {
          $scope.running = false;
          $scope.hasSucceeded = false;
          $scope.hasFailed = true;
        }
      );
    };
  })
  .controller('changePasswordController', function($scope, loginAPI, notificationFactory) {
    $scope.running = false;
    $scope.hasSucceeded = false;
    $scope.credentials = {};

    $scope.changePassword = function(form) {
      if (form.$invalid) {
        return;
      }

      $scope.running = true;

      return loginAPI.changePassword($scope.credentials.oldpassword, $scope.credentials.newpassword).then(
        function() {
          $scope.running = false;
          $scope.hasSucceeded = true;
        },
        function(response) {
          var invalidPassword = response.data.error.details.match(/The passwords do not match/);

          $scope.running = false;
          $scope.hasSucceeded = false;
          notificationFactory.weakError('', invalidPassword ?
            'Old password is invalid' :
            'Failed to change password, try again later'
          );
        }
      );
    };
  })
  .controller('logoutController', function(session) {
    session.setLogout();
    window.location.href = '/logout';
  })
  .factory('loginAPI', function(esnRestangular, moment) {

    function login(credentials) {
      return esnRestangular.all('login').post(credentials, null, { 'X-ESN-Time-Zone': moment.tz.guess() });
    }

    function askForPasswordReset(email) {
      return esnRestangular.all('passwordreset').post({email: email});
    }

    function updatePassword(password, jwtToken) {
      return esnRestangular.one('passwordreset').customPUT({password: password}, undefined, {jwt: jwtToken});
    }

    function changePassword(oldpassword, newpassword) {
      return esnRestangular.one('passwordreset').one('changepassword').customPUT({oldpassword: oldpassword, newpassword: newpassword});
    }

    return {
      login: login,
      askForPasswordReset: askForPasswordReset,
      updatePassword: updatePassword,
      changePassword: changePassword
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

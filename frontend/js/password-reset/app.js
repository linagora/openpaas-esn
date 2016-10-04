'use strict';

angular.module('passwordResetApp', [
    'esn.form.helper',
    'esn.login',
    'esn.http',
    'ngRoute',
    'materialAdmin'
  ])
  .config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/passwordreset', {
      templateUrl: '/views/password-reset/partials/home',
      controller: 'passwordResetController'
    });
    $locationProvider.html5Mode(true);
  })
  .controller('passwordResetController', function($scope, $window, $location, $timeout, loginAPI) {
    $scope.hasFailed = false;
    $scope.hasSucceeded = false;
    $scope.resetPassword = function(form) {
      if (form.$invalid) {
        return;
      }

      loginAPI.updatePassword($scope.credentials.password, $location.search().jwt).then(function() {
        $scope.hasFailed = false;
        $scope.hasSucceeded = true;
        $timeout(function() {
          $window.location = '/';
        }, 5000);
      }, function() {
        $scope.hasFailed = true;
        $scope.hasSucceeded = false;
      });
    };
  });

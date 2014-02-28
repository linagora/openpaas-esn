'use strict';

angular.module('esn.invitation', ['restangular'])
.controller('signup', function($scope, invitationAPI) {

    $scope.settings = { firstname: '', lastname: '', email: ''};
    $scope.step = 0;
    $scope.EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;
    $scope.signupButton = {
      label: 'Signup',
      notRunning: 'Signup',
      running: 'Please Wait...'
    };
    $scope.signupTask = {
      running: false
    };

    $scope.signup = function() {
      $scope.signupTask.running = true;
      $scope.signupButton.label = $scope.signupButton.running;
      $scope.step++;
      var payload = {data: $scope.settings, type: 'signup'};
      invitationAPI.create(payload).then(
        function(data) {
          $scope.signupTask.running = false;
          return data;
        },
        function(err) {
          $scope.signupButton.label = $scope.signupButton.notRunning;
          $scope.signupTask.running = false;
          $scope.error = {
            status: 'error',
            details: err
          };
          return $scope.error;
        }
      );
    };

    $scope.validValues = function() {
      return (($scope.settings.firstname && $scope.settings.firstname.length > 0) &&
        ($scope.settings.lastname && $scope.settings.lastname.length) &&
        ($scope.settings.email && $scope.settings.email.length > 0 && $scope.EMAIL_REGEXP.test($scope.settings.email))) ? true : false;
    };
  })
.controller('finalize', function($scope, $route, $routeParams, invitationAPI) {
})
.factory('invitationAPI', ['Restangular', function(Restangular) {

  function get(id) {
    return Restangular.one('invitation', id).get();
  }

  function create(settings) {
    return Restangular.all('invitation').post(settings);
  }

  return {
    get: get,
    create: create
  };
}]);

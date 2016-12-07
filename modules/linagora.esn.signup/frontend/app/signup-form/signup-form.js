'use strict';

angular.module('linagora.esn.signup')

  .directive('signupForm', function() {
    return {
      restrict: 'E',
      controller: function($scope, $location, invitationAPI) {
        $scope.settings = {firstname: '', lastname: '', email: ''};
        $scope.signupButton = {
          label: 'Sign up in OpenPaas',
          notRunning: 'Sign up in OpenPaas',
          running: 'Please wait...'
        };
        $scope.signupTask = {
          running: false
        };

        $scope.signup = function() {
          if ($scope.form.$invalid) {
            return;
          }

          $scope.signupTask.running = true;
          $scope.signupButton.label = $scope.signupButton.running;

          var payload = {data: $scope.settings, type: 'signup'};

          invitationAPI.create(payload).then(
            function() {
              $scope.signupTask.running = false;
              $location.path('/confirm');
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
      },
      controllerAs: 'ctrl',
      templateUrl: '/signup/app/signup-form/signup-form.html'
    };
  });

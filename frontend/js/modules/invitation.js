'use strict';

angular.module('esn.invitation', ['restangular'])
.controller('signup', function($scope, invitationAPI) {
    $scope.settings = { firstname: '', lastname: '', email: ''};
    $scope.step = 0;
    $scope.EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;
    $scope.signupButton = {
      label: 'Sign up in Hiveet',
      notRunning: 'Sign up in Hiveet',
      running: 'Please Wait...'
    };
    $scope.signupTask = {
      running: false
    };

    $scope.signup = function() {
      if ( !$scope.validValues() ) {
        return ;
      }
      $scope.signupTask.running = true;
      $scope.signupButton.label = $scope.signupButton.running;
      var payload = {data: $scope.settings, type: 'signup'};
      invitationAPI.create(payload).then(
        function(data) {
          $scope.step++;
          $scope.signupTask.running = false;
          return data;
        },
        function(err) {
          $scope.step++;
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
        ($scope.settings.lastname && $scope.settings.lastname.length > 0) &&
        ($scope.settings.email && $scope.settings.email.length > 0 && $scope.EMAIL_REGEXP.test($scope.settings.email))) ? true : false;
    };
  })
.controller('finalize', function($scope, invitationAPI, invitation) {
    $scope.invitation = invitation;
    $scope.notFound = $scope.invitation.status === 'error' ? true : false;
    $scope.settings = {};
    $scope.invitationId = null;

    if (!$scope.notFound) {
      $scope.apidata = $scope.invitation.data;
      $scope.settings = { firstname: $scope.apidata.data.firstname, lastname: $scope.apidata.data.lastname, company: '', domain: '', password: '', confirmpassword: ''};
      $scope.invitationId = $scope.apidata.uuid;
    }

    $scope.finalizeButton = {
      label: 'Signup',
      notRunning: 'Signup',
      running: 'Signin Up...'
    };
    $scope.finalizeTask = {
      running: false
    };

    $scope.finalize = function() {
      $scope.finalizeTask.running = true;
      $scope.finalizeButton.label = $scope.finalizeButton.running;

      var payload = {data: $scope.settings, type: 'signup'};
      invitationAPI.finalize($scope.invitationId, payload).then(
        function(data) {
          $scope.finalizeButton.label = $scope.finalizeButton.notRunning;
          $scope.finalizeTask.running = false;
          $scope.complete = true;
          return data;
        },
        function(err) {
          $scope.finalizeButton.label = $scope.finalizeButton.notRunning;
          $scope.finalizeTask.running = false;
          $scope.error = {
            status: 'error',
            details: err
          };
          return $scope.error;
        }
      );
    };

    $scope.passwordMatch = function() {
      return ($scope.settings.password && ($scope.settings.password === $scope.settings.confirmpassword)) ? true : false;
    };

    $scope.passwordChange = function() {
      var password = angular.element(document.querySelector('#password-group'));
      var confirm = angular.element(document.querySelector('#confirmpassword-group'));

      if ($scope.passwordMatch() && $scope.passwordStrength()) {
        password.removeClass('has-error');
        confirm.removeClass('has-error');
        password.addClass('has-success');
        confirm.addClass('has-success');
      } else {
        password.removeClass('has-success');
        confirm.removeClass('has-success');
        password.addClass('has-error');
        confirm.addClass('has-error');
      }
    };

    $scope.passwordStrength = function() {
      return $scope.settings.password && $scope.settings.password.length >= 8 ? true : false;
    };

    $scope.checkDomain = function() {
      return true;
    };

    $scope.checkCompany = function() {
      return true;
    };

    $scope.validValues = function() {
      return (($scope.settings.firstname && $scope.settings.firstname.length > 0) &&
        ($scope.settings.lastname && $scope.settings.lastname.length > 0) &&
        ($scope.settings.company && $scope.settings.company.length > 0) &&
        ($scope.settings.domain && $scope.settings.domain.length > 0) &&
        $scope.passwordMatch() && $scope.passwordStrength()) ? true : false;
    };
  })
.factory('invitationAPI', ['Restangular', function(Restangular) {

  function get(id) {
    return Restangular.one('invitation', id).get();
  }

  function create(settings) {
    return Restangular.all('invitation').post(settings);
  }

  function finalize(id, settings) {
    return Restangular.one('invitation', id).customPUT(settings);
  }

  return {
    get: get,
    create: create,
    finalize: finalize
  };
}]);

'use strict';

angular.module('esn.invitation', ['restangular', 'esn.form.helper'])
.controller('signup', function($scope, $location, invitationAPI) {
    $scope.settings = { firstname: '', lastname: '', email: ''};
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
        function(data) {
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
  })
.controller('finalize', function($scope, $window, invitationAPI, loginAPI, invitation) {
    $scope.notFound = invitation.status === 'error' ? true : false;
    $scope.form = {};
    $scope.settings = {};
    $scope.invited = false;

    var company_name, domain_name;

    if (invitation.type === 'addmember') {
      company_name = invitation.data.domain.company_name;
      domain_name = invitation.data.domain.name;
      $scope.invited = true;
    }

    if (!$scope.notFound) {
      $scope.invitationId = invitation.uuid;
      $scope.settings = invitation.data;
      if (invitation.type === 'addmember') {
        $scope.settings.domain = domain_name;
        $scope.settings.company = company_name;
      }
      $scope.editCompany = invitation.type === 'addmember' ? false : true;
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
      if ($scope.form.$invalid) {
        return false;
      }
      $scope.finalizeTask.running = true;
      $scope.finalizeButton.label = $scope.finalizeButton.running;

      var payload = {data: $scope.settings, type: invitation.type || 'signup'};
      invitationAPI.finalize($scope.invitationId, payload).then(
        function(data) {
          $scope.finalizeButton.label = $scope.finalizeButton.notRunning;
          $scope.finalizeTask.running = false;
          $scope.complete = true;
          var credentials = {username: $scope.settings.email, password: $scope.settings.password};
          loginAPI.login(credentials).then(function() {
            $window.location.href = '/';
          }, function(err) {
            $scope.error = {
              status: 'error',
              details: err
            };
            return $scope.error;
          });

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
  })
.factory('invitationAPI', ['Restangular', function(Restangular) {

  function get(id) {
    return Restangular.one('invitations', id).get();
  }

  function create(settings) {
    return Restangular.all('invitations').post(settings);
  }

  function finalize(id, settings) {
    return Restangular.one('invitations', id).customPUT(settings);
  }

  return {
    get: get,
    create: create,
    finalize: finalize
  };
}]);

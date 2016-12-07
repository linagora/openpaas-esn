'use strict';

angular.module('linagora.esn.signup')

  .component('signupFinalizeForm', {
    restrict: 'E',
    controller: function($scope, $route, $window, invitationAPI, loginAPI, _) {
      invitationAPI.get($route.current.params.id).then(_.property('data')).then(function(invitation) {
        $scope.notFound = invitation.status === 'error';
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
          $scope.editCompany = invitation.type !== 'addmember';
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
      }, function(err) {
        $scope.error = {
          status: 'error',
          details: err
        };
      });
    },
    templateUrl: '/signup/app/signup-finalize-form/signup-finalize-form.html'
  });

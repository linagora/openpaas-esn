'use strict';

angular.module('linagora.esn.signup')

  .component('signupFinalize', {
    restrict: 'E',
    controller: function($timeout, $route, $window, invitationAPI, loginAPI, _) {
      $timeout(function() {
        invitationAPI.get($route.current.params.id)
          .then(_.property('data'))
          .then(function(invitation) {
            return invitationAPI.finalize(invitation.uuid, { data: invitation.data, type: invitation.type }).then(_.constant(invitation));
          })
          .then(function(invitation) {
            return loginAPI.login({ username: invitation.data.email, password: invitation.data.password });
          })
          .finally(function() {
            $window.location = '/';
          });
      }, 0);
    },
    templateUrl: '/signup/app/signup-finalize/signup-finalize.html'
  });

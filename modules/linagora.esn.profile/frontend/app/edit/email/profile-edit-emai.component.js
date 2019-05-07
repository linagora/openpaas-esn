(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileEditEmail', {
      templateUrl: '/profile/app/edit/email/profile-edit-email.html',
      controller: 'ProfileEditEmailController',
      bindings: {
        user: '='
      }
    });
})(angular);

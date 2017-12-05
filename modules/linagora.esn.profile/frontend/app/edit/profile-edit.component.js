(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileEdit', {
      templateUrl: '/profile/app/edit/profile-edit.html',
      controller: 'profileEditController',
      bindings: {
        user: '<'
      }
    });
})(angular);

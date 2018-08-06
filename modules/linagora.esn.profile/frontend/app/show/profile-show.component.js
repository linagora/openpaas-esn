(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShow', {
      templateUrl: '/profile/app/show/profile-show.html',
      bindings: {
        user: '<',
        me: '<',
        canEdit: '<'
      }
    });
})(angular);
